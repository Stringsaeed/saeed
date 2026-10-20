// Scoped timers for the vendored explainer figures. Upstream figures call requestAnimationFrame and setInterval
// directly and never tear anything down: on their own page a figure lives as long as the page. Here a figure mounts
// into a React island that can scroll away, pause, or unmount, so the sync script points those calls at this module
// (see PATCHES in scripts/sync-pewpew.ts), and every timer belongs to the scope of the figure that created it.
//
// A scope is "current" while code of its figure runs: during mount, inside its own timer callbacks, and during DOM
// events on its root (the island marks them with enterOnEvent). While a scope is inactive its timers are held, not
// run: a pending frame waits, and an interval stops ticking until the scope is active again. dispose() drops them all.
// Called with no current scope, the functions fall back to the browser's own.

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

  /** Makes this scope current for the rest of a DOM event dispatch. Use as a capture listener on the root. */
  enterOnEvent = (): void => {
    current = this;
    setTimeout(() => {
      if (current === this) current = null;
    }, 0);
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
    } else {
      timer.handle = window.setInterval(() => {
        this.#tick();
        this.run(timer.callback);
      }, timer.ms);
    }
  }

  #stop(timer: Timer): void {
    if (timer.handle === null) return;
    if (timer.kind === "frame") window.cancelAnimationFrame(timer.handle);
    else window.clearInterval(timer.handle);
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
  });
}

export function clearInterval(id: number): void {
  const owner = owners.get(id);
  if (owner) owner.cancel(id);
  else window.clearInterval(id);
}
