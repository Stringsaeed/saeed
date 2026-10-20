// Scoped timers for the vendored explainer figures. Upstream figures call requestAnimationFrame and setInterval
// directly and never tear anything down: on their own page a figure lives as long as the page. Here a figure mounts
// into a React island that can scroll away, pause, or unmount, so the sync script points those calls at this module
// (see PATCHES in scripts/sync-pewpew.ts), and every timer belongs to the scope of the figure that created it.
//
// A scope is "current" while code of its figure runs: during mount, inside its own timer callbacks, and during DOM
// events on its root (the island marks them with enterOnEvent and exitOnEvent). While a scope is inactive its timers
// are held, not run: a pending frame waits, and an interval stops ticking until the scope is active again, then
// resumes with the time it had left. dispose() drops them all. Called with no current scope, the functions fall back
// to the browser's own.

type Timer =
  | {
      readonly kind: "frame";
      readonly callback: FrameRequestCallback;
      handle: number | null;
    }
  | {
      readonly kind: "interval";
      readonly callback: () => void;
      readonly ms: number;
      handle: number | null;
      /** Whether `handle` is the one-off timeout that finishes a period cut short by a pause. */
      resuming: boolean;
      /** performance.now() when the next tick is due, while running. */
      dueAt: number;
      /** Milliseconds left of the current period when it was paused, or null for a full period. */
      left: number | null;
    };

let current: FigureScope | null = null;
// Negative, so a scoped id never collides with a browser timer id from the fallback path. Still truthy, which
// upstream relies on (`if (timer) clearInterval(timer)`).
let nextId = -1;
const owners = new Map<number, FigureScope>();

export class FigureScope {
  readonly name: string;
  /** Timer callbacks run so far. Dev tooling reads it to check that nothing runs off screen. */
  runs = 0;
  /** performance.now() of the last timer callback, or null before the first. */
  lastRunAt: number | null = null;
  /** Set by the island: pauses the figure the way its play button does. */
  onPauseRequest: (() => void) | null = null;
  #active = false;
  #disposed = false;
  readonly #timers = new Map<number, Timer>();

  constructor(name: string) {
    this.name = name;
  }

  get active(): boolean {
    return this.#active;
  }

  /** Runs `fn` with this scope current, so timers it creates belong here. */
  run<T>(fn: () => T): T {
    const previous = current;
    current = this;
    try {
      return fn();
    } finally {
      current = previous;
    }
  }

  /**
   * Makes this scope current for an event on the figure's root: a capture listener, so it runs before the figure's
   * own handlers. exitOnEvent (a bubble listener) clears it after them. Events that do not bubble never reach
   * exitOnEvent, so a timeout clears it too. Not a microtask: the browser runs microtasks between listeners, which
   * would clear the scope before the figure's handler runs.
   */
  enterOnEvent = (): void => {
    current = this;
    setTimeout(this.exitOnEvent, 0);
  };

  exitOnEvent = (): void => {
    if (current === this) current = null;
  };

  setActive(active: boolean): void {
    if (this.#disposed || active === this.#active) return;
    this.#active = active;
    for (const [id, timer] of this.#timers) {
      if (active) this.#start(id, timer);
      else this.#stop(timer);
    }
  }

  /** Cancels every timer and ignores any created later. */
  dispose(): void {
    this.#disposed = true;
    this.#active = false;
    for (const [id, timer] of this.#timers) {
      this.#stop(timer);
      owners.delete(id);
    }
    this.#timers.clear();
  }

  add(timer: Timer): number {
    const id = nextId--;
    if (this.#disposed) return id;
    this.#timers.set(id, timer);
    owners.set(id, this);
    if (this.#active) this.#start(id, timer);
    return id;
  }

  cancel(id: number): void {
    const timer = this.#timers.get(id);
    if (!timer) return;
    this.#stop(timer);
    this.#timers.delete(id);
    owners.delete(id);
  }

  #tick(): void {
    this.runs += 1;
    this.lastRunAt = performance.now();
  }

  #start(id: number, timer: Timer): void {
    if (timer.handle !== null) return;
    if (timer.kind === "frame") {
      timer.handle = window.requestAnimationFrame((time) => {
        this.#timers.delete(id);
        owners.delete(id);
        this.#tick();
        this.run(() => timer.callback(time));
      });
      return;
    }
    const fire = () => {
      timer.dueAt = performance.now() + timer.ms;
      this.#tick();
      this.run(timer.callback);
    };
    const every = () => {
      timer.resuming = false;
      timer.dueAt = performance.now() + timer.ms;
      timer.handle = window.setInterval(fire, timer.ms);
    };
    const left = timer.left;
    timer.left = null;
    if (left === null || left >= timer.ms) {
      every();
      return;
    }
    // Finish the period the pause cut short, then tick at the full rate.
    timer.resuming = true;
    timer.dueAt = performance.now() + left;
    timer.handle = window.setTimeout(() => {
      timer.handle = null;
      fire();
      // The callback may have cleared this timer, or the scope may have gone inactive.
      if (
        this.#timers.get(id) === timer &&
        this.#active &&
        timer.handle === null
      )
        every();
    }, left);
  }

  #stop(timer: Timer): void {
    if (timer.handle === null) return;
    if (timer.kind === "frame") window.cancelAnimationFrame(timer.handle);
    else {
      timer.left = Math.max(0, timer.dueAt - performance.now());
      if (timer.resuming) window.clearTimeout(timer.handle);
      else window.clearInterval(timer.handle);
      timer.resuming = false;
    }
    timer.handle = null;
  }
}

/** Pauses the current figure through the site's play/pause state. The pool
 *  figure calls it where upstream set its own `running = false`. */
export function pauseFigure(): void {
  current?.onPauseRequest?.();
}

export function requestAnimationFrame(callback: FrameRequestCallback): number {
  if (current === null) return window.requestAnimationFrame(callback);
  return current.add({
    kind: "frame",
    callback,
    handle: null,
  });
}

export function cancelAnimationFrame(id: number): void {
  const owner = owners.get(id);
  if (owner) owner.cancel(id);
  else window.cancelAnimationFrame(id);
}

export function setInterval(callback: () => void, ms: number): number {
  if (current === null) return window.setInterval(callback, ms);
  return current.add({
    kind: "interval",
    callback,
    ms,
    handle: null,
    resuming: false,
    dueAt: 0,
    left: null,
  });
}

export function clearInterval(id: number): void {
  const owner = owners.get(id);
  if (owner) owner.cancel(id);
  else window.clearInterval(id);
}
