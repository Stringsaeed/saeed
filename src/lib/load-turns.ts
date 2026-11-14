import { onIdle } from "./idle";

// The home page starts several pieces of heavy work once it has painted:
// building the cartridges and bringing them in, drawing the book previews,
// and the backdrop. Started together they share the same frames, and every
// animation among them drops some. This hands out turns instead: one piece
// at a time, the most visible first, each in an idle moment once the one
// before it is done, or has had long enough.

/** Who goes first when several are waiting: higher first. */
export const TURN = {
  cartridges: 3,
  books: 2,
  backdrop: 1,
} as const;

type Waiting = {
  priority: number;
  begin: () => void;
};

const waiting: Waiting[] = [];
let busy = false;
let next: (() => void) | null = null;

function drainSoon() {
  if (busy || next || waiting.length === 0) return;
  next = onIdle(() => {
    next = null;
    if (busy) return;
    waiting.sort((a, b) => b.priority - a.priority);
    waiting.shift()?.begin();
  });
}

/**
 * Asks for a turn. `start` runs when the turn comes, and calls `done` when
 * its work, animation included, is over; after `limit` milliseconds the next
 * turn starts regardless. Returns a cancel: it withdraws a waiting request,
 * or ends a running turn.
 */
export function takeTurn(
  priority: number,
  start: (done: () => void) => void,
  limit = 3000,
) {
  let state: "waiting" | "running" | "over" = "waiting";
  let timer: ReturnType<typeof setTimeout> | undefined;

  const done = () => {
    if (state !== "running") return;
    state = "over";
    clearTimeout(timer);
    busy = false;
    drainSoon();
  };

  const entry: Waiting = {
    priority,
    begin: () => {
      state = "running";
      busy = true;
      timer = setTimeout(done, limit);
      try {
        start(done);
      } catch {
        done();
      }
    },
  };

  waiting.push(entry);
  drainSoon();

  return () => {
    if (state === "waiting") {
      state = "over";
      const at = waiting.indexOf(entry);
      if (at >= 0) waiting.splice(at, 1);
      return;
    }
    done();
  };
}
