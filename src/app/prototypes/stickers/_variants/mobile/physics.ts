import { ARM_PARENT, ARMS, LEAF_PARENT, LEAVES } from "./tree";

// Damped pendulums for the seven arms and eight threads, integrated in one
// requestAnimationFrame loop that writes CSS custom properties and sleeps as
// soon as everything has settled. Idle drift is CSS keyframes, not this loop.

const DEG = 1;
// Spring stiffness per arm (1/s²): big arms swing slow, small arms quick.
const ARM_K = ARMS.map((node) =>
  node.span >= 264 ? 20 : node.span >= 176 ? 30 : 44,
);
const ARM_ZETA = 0.22;
const ARM_C = ARM_K.map((k) => 2 * ARM_ZETA * Math.sqrt(k));
// A parent swinging drags its children's hooks along.
const ARM_COUPLE = 0.35;
const LEAF_K = 58;
const LEAF_C = 2 * 0.1 * Math.sqrt(LEAF_K);
const LEAF_COUPLE = 0.6;
const MAX_LEAF_V = 160;
const MAX_ARM_V = 60;
const SLEEP_V = 0.04;
const SLEEP_X = 0.01;
const MAX_DT = 1 / 30;
const SUBSTEPS = 2;

export type MobileSim = {
  setTargets(targets: number[]): void;
  nudgeLeaf(index: number, velocity: number): void;
  nudgeArm(index: number, velocity: number): void;
  // Entrance: a staggered kick from the top down, like hanging a wind chime.
  hang(): void;
  destroy(): void;
};

export function createMobileSim({
  arms,
  swings,
  reduceMotion,
}: {
  arms: HTMLElement[];
  swings: HTMLElement[];
  reduceMotion: boolean;
}): MobileSim {
  const armCount = ARMS.length;
  const leafCount = LEAVES.length;
  const angle = new Float64Array(armCount);
  const velocity = new Float64Array(armCount);
  const acceleration = new Float64Array(armCount);
  const target = new Float64Array(armCount);
  const leafAngle = new Float64Array(leafCount);
  const leafVelocity = new Float64Array(leafCount);
  let frame = 0;
  let last = 0;
  let destroyed = false;
  const timers: number[] = [];

  const write = () => {
    for (let i = 0; i < armCount; i++) {
      arms[i]?.style.setProperty("--a", `${angle[i].toFixed(3)}deg`);
    }
    for (let i = 0; i < leafCount; i++) {
      swings[i]?.style.setProperty("--p", `${leafAngle[i].toFixed(3)}deg`);
    }
  };

  const settled = () => {
    for (let i = 0; i < armCount; i++) {
      if (Math.abs(velocity[i]) > SLEEP_V) return false;
      if (Math.abs(angle[i] - target[i]) > SLEEP_X) return false;
    }
    for (let i = 0; i < leafCount; i++) {
      if (Math.abs(leafVelocity[i]) > SLEEP_V) return false;
      if (Math.abs(leafAngle[i]) > SLEEP_X) return false;
    }
    return true;
  };

  const snap = () => {
    for (let i = 0; i < armCount; i++) {
      angle[i] = target[i];
      velocity[i] = 0;
    }
    leafAngle.fill(0);
    leafVelocity.fill(0);
    write();
  };

  const integrate = (dt: number) => {
    // Arms are indexed parents-first, so a parent's acceleration is fresh
    // when its children read it.
    for (let i = 0; i < armCount; i++) {
      const parent = ARM_PARENT[i];
      const drag = parent >= 0 ? ARM_COUPLE * acceleration[parent] : 0;
      acceleration[i] =
        -ARM_K[i] * (angle[i] - target[i]) - ARM_C[i] * velocity[i] - drag;
      velocity[i] += acceleration[i] * dt;
      angle[i] += velocity[i] * dt;
    }
    for (let i = 0; i < leafCount; i++) {
      const parent = LEAF_PARENT[i];
      const drag = parent >= 0 ? LEAF_COUPLE * acceleration[parent] : 0;
      const a = -LEAF_K * leafAngle[i] - LEAF_C * leafVelocity[i] - drag;
      leafVelocity[i] += a * dt;
      leafAngle[i] += leafVelocity[i] * dt;
    }
  };

  const tick = (now: number) => {
    frame = 0;
    if (destroyed) return;
    const dt = Math.min(MAX_DT, (now - last) / 1000 || 1 / 60);
    last = now;
    for (let s = 0; s < SUBSTEPS; s++) integrate(dt / SUBSTEPS);
    if (settled()) {
      snap();
      return;
    }
    write();
    frame = requestAnimationFrame(tick);
  };

  const wake = () => {
    if (destroyed || frame || document.hidden) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };

  const onVisibility = () => {
    if (document.hidden) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      return;
    }
    if (!settled()) wake();
  };
  document.addEventListener("visibilitychange", onVisibility);

  const later = (ms: number, run: () => void) => {
    timers.push(window.setTimeout(run, ms));
  };

  write();

  return {
    setTargets(next) {
      for (let i = 0; i < armCount; i++) target[i] = next[i] ?? 0;
      if (reduceMotion) {
        snap();
        return;
      }
      wake();
    },
    nudgeLeaf(index, dv) {
      if (reduceMotion) return;
      leafVelocity[index] = Math.max(
        -MAX_LEAF_V,
        Math.min(MAX_LEAF_V, leafVelocity[index] + dv * DEG),
      );
      wake();
    },
    nudgeArm(index, dv) {
      if (reduceMotion) return;
      velocity[index] = Math.max(
        -MAX_ARM_V,
        Math.min(MAX_ARM_V, velocity[index] + dv * DEG),
      );
      wake();
    },
    hang() {
      if (reduceMotion) return;
      later(0, () => {
        velocity[0] += 3;
        wake();
      });
      later(140, () => {
        velocity[1] -= 5;
        velocity[2] += 5;
        wake();
      });
      later(300, () => {
        for (let i = 3; i < armCount; i++) velocity[i] += i % 2 ? 7 : -7;
        wake();
      });
      for (let i = 0; i < leafCount; i++) {
        later(420 + i * 40, () => {
          leafVelocity[i] += i % 2 ? -26 : 26;
          wake();
        });
      }
    },
    destroy() {
      destroyed = true;
      if (frame) cancelAnimationFrame(frame);
      for (const timer of timers) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
