import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import {
  clearInterval,
  FigureScope,
  requestAnimationFrame,
  setInterval,
} from "./shims/frames";

// A fake browser clock: timers fire only when the test advances time or runs a frame.
class FakeClock {
  now = 0;
  #nextId = 1;
  readonly frames = new Map<number, FrameRequestCallback>();
  readonly timers = new Map<
    number,
    {
      callback: () => void;
      dueAt: number;
      every: number | null;
    }
  >();
  readonly cleared: number[] = [];

  window = {
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      const id = this.#nextId++;
      this.frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id: number) => {
      this.frames.delete(id);
    },
    setInterval: (callback: () => void, ms: number) =>
      this.#add(callback, ms, ms),
    setTimeout: (callback: () => void, ms: number) =>
      this.#add(callback, ms, null),
    clearInterval: (id: number) => this.#clear(id),
    clearTimeout: (id: number) => this.#clear(id),
  };

  #add(callback: () => void, ms: number, every: number | null): number {
    const id = this.#nextId++;
    this.timers.set(id, {
      callback,
      dueAt: this.now + ms,
      every,
    });
    return id;
  }

  #clear(id: number): void {
    this.cleared.push(id);
    this.timers.delete(id);
  }

  /** Runs every pending animation frame once. */
  frame(): void {
    const due = [
      ...this.frames,
    ];
    this.frames.clear();
    for (const [, callback] of due) callback(this.now);
  }

  advance(ms: number): void {
    const end = this.now + ms;
    for (;;) {
      let next:
        | [
            number,
            {
              dueAt: number;
            },
          ]
        | null = null;
      for (const entry of this.timers)
        if (entry[1].dueAt <= end && (!next || entry[1].dueAt < next[1].dueAt))
          next = entry;
      if (!next) break;
      const [id] = next;
      const timer = this.timers.get(id);
      if (!timer) break;
      this.now = timer.dueAt;
      if (timer.every === null) this.timers.delete(id);
      else timer.dueAt += timer.every;
      timer.callback();
    }
    this.now = end;
  }
}

let clock: FakeClock;
const saved = {
  window: Object.getOwnPropertyDescriptor(globalThis, "window"),
  performance: Object.getOwnPropertyDescriptor(globalThis, "performance"),
};

beforeEach(() => {
  clock = new FakeClock();
  Object.defineProperty(globalThis, "window", {
    value: clock.window,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "performance", {
    value: {
      now: () => clock.now,
    },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  for (const key of [
    "window",
    "performance",
  ] as const) {
    const descriptor = saved[key];
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

describe("FigureScope", () => {
  test("holds timers created in run() while inactive and starts them on setActive(true)", () => {
    const scope = new FigureScope("test");
    let ticks = 0;
    let frames = 0;
    scope.run(() => {
      setInterval(() => ticks++, 100);
      requestAnimationFrame(() => frames++);
    });
    clock.advance(500);
    clock.frame();
    assert.equal(ticks, 0);
    assert.equal(frames, 0);
    assert.equal(clock.timers.size, 0, "nothing scheduled with the browser");

    scope.setActive(true);
    clock.advance(250);
    clock.frame();
    assert.equal(ticks, 2);
    assert.equal(frames, 1);
    assert.equal(scope.runs, 3);
  });

  test("a frame requested from a frame callback stays in the scope", () => {
    const scope = new FigureScope("test");
    let frames = 0;
    const loop = () => {
      frames++;
      requestAnimationFrame(loop);
    };
    scope.run(() => requestAnimationFrame(loop));
    scope.setActive(true);
    clock.frame();
    clock.frame();
    assert.equal(frames, 2);
    scope.setActive(false);
    clock.frame();
    assert.equal(frames, 2, "the loop is held while inactive");
    scope.setActive(true);
    clock.frame();
    assert.equal(frames, 3);
  });

  test("an interval cleared from its own callback stops", () => {
    const scope = new FigureScope("test");
    scope.setActive(true);
    let ticks = 0;
    const id = scope.run(() =>
      setInterval(() => {
        ticks++;
        clearInterval(id);
      }, 100),
    );
    clock.advance(1000);
    assert.equal(ticks, 1);
    assert.equal(clock.timers.size, 0);
  });

  test("a paused interval resumes with the time it had left", () => {
    const scope = new FigureScope("test");
    scope.setActive(true);
    let ticks = 0;
    scope.run(() => setInterval(() => ticks++, 100));
    clock.advance(70);
    scope.setActive(false);
    clock.advance(1000);
    assert.equal(ticks, 0);
    scope.setActive(true);
    clock.advance(29);
    assert.equal(ticks, 0);
    clock.advance(1);
    assert.equal(ticks, 1, "the first tick comes after the remaining 30 ms");
    clock.advance(100);
    assert.equal(ticks, 2, "then the full period again");
  });

  test("dispose() cancels every timer and ignores later ones", () => {
    const scope = new FigureScope("test");
    scope.setActive(true);
    let calls = 0;
    scope.run(() => {
      setInterval(() => calls++, 100);
      requestAnimationFrame(() => calls++);
    });
    scope.dispose();
    clock.advance(1000);
    clock.frame();
    assert.equal(calls, 0);
    scope.run(() => setInterval(() => calls++, 100));
    scope.setActive(true);
    clock.advance(1000);
    assert.equal(calls, 0);
    assert.equal(clock.timers.size, 0);
    assert.equal(clock.frames.size, 0);
  });

  test("clearing an id no scope owns falls through to the browser", () => {
    clearInterval(42);
    assert.deepEqual(
      clock.cleared,
      [
        42,
      ],
    );
  });

  test("with no current scope, timers go straight to the browser", () => {
    let ticks = 0;
    setInterval(() => ticks++, 100);
    clock.advance(200);
    assert.equal(ticks, 2);
  });
});
