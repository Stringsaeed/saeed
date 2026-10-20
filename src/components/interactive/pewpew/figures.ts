"use client";

// Every PewPew figure from one module. The registry imports them all from
// here, so the bundler emits one chunk holding the vendored sim, the
// explainer's helpers, and the highlighter, instead of copying the sim into
// a chunk per figure. The first PewPew figure a reader reaches loads it;
// the rest are then free.

export { PewpewBoss } from "./boss";
export { PewpewBot } from "./bot";
export { PewpewCamera } from "./camera";
export { PewpewCollide } from "./collide";
export { PewpewDrones } from "./drones";
export { PewpewFlow } from "./flow";
export { PewpewFrame } from "./frame";
export { PewpewHero } from "./hero";
export { PewpewLevel } from "./level";
export { PewpewPool } from "./pool";
export { PewpewProof } from "./proof";
export { PewpewRuntimes } from "./runtimes";
export { PewpewSteer } from "./steer";
export { PewpewStep } from "./step";
export { PewpewThreads } from "./threads";
export { PewpewTrack } from "./track";
