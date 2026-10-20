import assert from "node:assert/strict";
import { describe, test } from "node:test";
import golden from "./golden.json";
import { greedyBot } from "./vendor/src/bot";
import { LEVELS } from "./vendor/src/levels";
import {
  COAST,
  createWorld,
  hashWorld,
  type SimEvent,
  simulate,
  step,
  TICKS_PER_SEC,
} from "./vendor/src/sim";

// Mirrors scripts/verify-levels.ts upstream: each golden row is `simulate(n, greedyBot)` written as
// `n hash steps score stars`, with the hash as 8 lowercase hex digits.
const hex = (h: number): string => h.toString(16).padStart(8, "0");

describe("vendored pewpew sim", () => {
  test("level 1 stepped by hand with greedyBot matches the golden row", () => {
    const row = golden.find((r) => r.n === 1);
    assert.ok(row, "golden.json has no row for level 1");

    // The same loop as run() in src/sim/run.ts: the bot's target is stored as float32 before it is stepped, which is
    // what makes the recorded stream replay bit for bit, so the hash depends on it.
    const w = createWorld(1);
    const out: SimEvent[] = [];
    const limit = Math.floor(
      (w.spec.length / w.spec.scroll + 240) * TICKS_PER_SEC,
    );
    let steps = 0;
    for (
      ;
      steps < limit && (w.phase.p === "fly" || w.phase.p === "boss");
      steps++
    ) {
      const target = greedyBot(w).targetX;
      const x = target === null ? Number.NaN : Math.fround(target);
      step(
        w,
        Number.isNaN(x)
          ? COAST
          : {
              targetX: x,
            },
        out,
      );
      out.length = 0;
    }

    assert.equal(w.phase.p, "won");
    assert.equal(steps, row.steps);
    assert.equal(w.score, row.score);
    assert.equal(hex(hashWorld(w)), row.hash);
  });

  test("every level matches verify-levels.golden.txt", () => {
    assert.equal(golden.length, LEVELS.length);
    for (const spec of LEVELS) {
      const r = simulate(spec.n, greedyBot);
      assert.deepEqual(
        {
          n: spec.n,
          hash: hex(r.hash),
          steps: r.steps,
          score: r.score,
          stars: r.stars,
        },
        golden[spec.n - 1],
      );
    }
  });
});
