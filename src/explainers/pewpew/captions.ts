// The caption under each PewPew figure. Upstream sets these with fig.caption() in explainer/src/figures/*.ts (and
// hero.ts and sound.ts, which are not vendored); they are copied here as plain text, because a post caption has no
// inline code. Wording differs from upstream only where upstream describes something this site does not have: the
// hero is the 2D sim view without the WebGPU renderer, and the sound figure is not ported yet.
//
// The Sanity import (scripts/pewpew-import.ts) and the dev previews attach these to the interactive blocks, so
// post.mdx and the markdown converter stay caption-free.
import type { InteractiveName } from "../../lib/interactive-names";
import type { ContentBlock } from "../../lib/markdown-to-portable-text";
import { dragInput } from "./vendor/src/sim/input";
import { COAST_DAMPING, DRAG_GAIN } from "./vendor/src/sim/rules";

export type PewpewFigureName = Extract<InteractiveName, `pewpew-${string}`>;

export const PEWPEW_CAPTIONS: Record<PewpewFigureName, string> = {
  "pewpew-hero":
    "createLoop, resetRun, advance, step, and greedyBot are imported from the game's source. This is the 2D sim view; the WebGPU renderer runs in the app and in the repo's own explainer, not on this site.",
  "pewpew-pool":
    "The real remove() from src/sim/world.ts, applied to this live pool.",
  "pewpew-step":
    "Each › runs the real stage function on a copy of the world and lists what it changed. Yellow rings mark bodies that a stage created or damaged. Click a dotted name to open its source.",
  // Upstream fills these numbers in from the sim's constants, and so does this.
  "pewpew-steer": `The plot calls the real steerVelocity 180 times. After the finger lifts, velocity is multiplied by COAST_DAMPING (${COAST_DAMPING}) each step. A full-width drag moves the target ${DRAG_GAIN} units: dragInput(0, 1) = ${dragInput(0, 1).targetX}.`,
  "pewpew-frame":
    "Each time the walk returns to line 1, it calls the real advance() once with a fake clock. The squares are the step() calls each frame ran.",
  "pewpew-threads":
    'Each column is one hop in the life of a frame. Click a dot to jump to it. Lit rows are the places involved. Switch to "In this page" to see where the same code runs as you read.',
  // Upstream gives this figure a title and no caption, so its title is the caption here.
  "pewpew-runtimes": "Every file, and where it runs.",
  "pewpew-level":
    "The row is read live from LEVELS in src/levels.ts, and the verifier line from the golden file. Click any field name.",
  "pewpew-track":
    "The strip is the real output of compileTrack for the chosen level, from the start (left) to the wormhole (right). Hover a dot for its spawn.",
  "pewpew-drones":
    "All four paths are drawn by running the real pattern functions until the drone passes the rocket. The current one is bright.",
  "pewpew-boss":
    "The highlighted card is what the real bossPhase returns for this hp. There is no phase variable to keep in sync: damage alone moves the fight forward.",
  "pewpew-collide":
    "Move the pointer over the dark box to move the rocket. Each move calls the real collide() on a one-body world, and the lit lines are the path it took.",
  "pewpew-bot":
    "The bot only ever outputs a target lane (thin line, whole units). Steering turns that into the smooth thick line. The level runs left to right.",
  "pewpew-proof":
    "Everything here runs the game's own simulate, replay, step, and hashWorld. Every level's golden row is checked into the repo, and npm run verify fails when a run stops matching it.",
  "pewpew-camera":
    "The track walls (x = ±4.5) and 5-unit rows, projected with the real uniform block. The camera backs off on narrow screens so the whole track width always fits.",
  "pewpew-flow":
    'Disabled buttons are actions this screen ignores: reduce returns the same object. "pick level 2" only works once level 1 has a star, because isUnlocked reads the save.',
  "pewpew-sound":
    "Not ported yet. In the repo's explainer, every sound is made by the game's createAudio with a browser AudioContext in place of the native one, and the buttons send the same SimEvents the sim emits.",
};

export function isPewpewFigureName(name: unknown): name is PewpewFigureName {
  return typeof name === "string" && Object.hasOwn(PEWPEW_CAPTIONS, name);
}

/** Gives each PewPew interactive block that has no caption its caption from PEWPEW_CAPTIONS. Other blocks pass through. */
export function withPewpewCaptions(blocks: ContentBlock[]): ContentBlock[] {
  return blocks.map((block) => {
    if (block._type !== "interactive" || !isPewpewFigureName(block.name))
      return block;
    if (typeof block.caption === "string" && block.caption.trim()) return block;
    return {
      ...block,
      caption: PEWPEW_CAPTIONS[block.name],
    };
  });
}
