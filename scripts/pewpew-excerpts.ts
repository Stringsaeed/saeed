// Extracts code excerpts from the vendored PewPew source into src/explainers/pewpew/excerpts.json, and the verifier's
// golden rows into golden.json. Ported from explainer/build.mjs in the pewpew repo (EXCERPTS, extract, golden).
// Usage: bun scripts/pewpew-excerpts.ts (after bun scripts/sync-pewpew.ts)
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "Stringsaeed/pewpew";
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = join(ROOT, "src/explainers/pewpew");
const VENDOR = join(OUT, "vendor");

/**
 * The excerpts from upstream's EXCERPTS whose files are vendored. The pattern matches the first line; the excerpt runs
 * to its closing brace. The stage functions match with or without `export`, so this works on either side of the
 * upstream change that exported them.
 * Skipped because their files are not vendored: recordRun, isUnlocked (src/save.ts); pump, playSfx, begin
 * (src/audio/engine.ts); EVENT_SFX (src/audio/data.ts); appSinks (App.tsx); gpuFrame, gpuInit (src/shell/useGpu.ts).
 */
const EXCERPTS: Record<
  string,
  [
    file: string,
    pattern: RegExp,
  ]
> = {
  step: [
    "src/sim/step.ts",
    /^export function step\(/,
  ],
  steer: [
    "src/sim/step.ts",
    /^(export )?function steer\(/,
  ],
  wellPull: [
    "src/sim/step.ts",
    /^(export )?function wellPull\(/,
  ],
  spawnFromTrack: [
    "src/sim/step.ts",
    /^(export )?function spawnFromTrack\(/,
  ],
  fire: [
    "src/sim/step.ts",
    /^(export )?function fire\(/,
  ],
  moveBodies: [
    "src/sim/step.ts",
    /^(export )?function moveBodies\(/,
  ],
  collide: [
    "src/sim/step.ts",
    /^(export )?function collide\(/,
  ],
  collect: [
    "src/sim/step.ts",
    /^function collect\(/,
  ],
  split: [
    "src/sim/step.ts",
    /^function split\(/,
  ],
  despawn: [
    "src/sim/step.ts",
    /^(export )?function despawn\(/,
  ],
  transition: [
    "src/sim/step.ts",
    /^(export )?function transition\(/,
  ],
  hurt: [
    "src/sim/step.ts",
    /^function hurt\(/,
  ],
  Bodies: [
    "src/sim/world.ts",
    /^export interface Bodies/,
  ],
  World: [
    "src/sim/world.ts",
    /^export interface World /,
  ],
  createWorld: [
    "src/sim/world.ts",
    /^export function createWorld\(/,
  ],
  add: [
    "src/sim/world.ts",
    /^export function add\(/,
  ],
  remove: [
    "src/sim/world.ts",
    /^export function remove\(/,
  ],
  compileTrack: [
    "src/sim/track.ts",
    /^export function compileTrack\(/,
  ],
  steerVelocity: [
    "src/sim/input.ts",
    /^export function steerVelocity\(/,
  ],
  dragInput: [
    "src/sim/input.ts",
    /^export function dragInput\(/,
  ],
  rand: [
    "src/sim/math.ts",
    /^export function rand\(/,
  ],
  sinT: [
    "src/sim/math.ts",
    /^export function sinT\(/,
  ],
  cosT: [
    "src/sim/math.ts",
    /^export function cosT\(/,
  ],
  clamp: [
    "src/sim/math.ts",
    /^export function clamp\(/,
  ],
  DRONE_MOVES: [
    "src/sim/drones.ts",
    /^export const DRONE_MOVES/,
  ],
  driveX: [
    "src/sim/drones.ts",
    /^function driveX\(/,
  ],
  droneClock: [
    "src/sim/drones.ts",
    /^export function droneClock\(/,
  ],
  runBoss: [
    "src/sim/boss.ts",
    /^export function runBoss\(/,
  ],
  bossAttack: [
    "src/sim/boss.ts",
    /^function bossAttack\(/,
  ],
  bossPhase: [
    "src/sim/boss.ts",
    /^(export )?function bossPhase\(/,
  ],
  simulate: [
    "src/sim/run.ts",
    /^export function simulate\(/,
  ],
  replay: [
    "src/sim/run.ts",
    /^export function replay\(/,
  ],
  run: [
    "src/sim/run.ts",
    /^function run\(/,
  ],
  hashWorld: [
    "src/sim/run.ts",
    /^export function hashWorld\(/,
  ],
  hudOf: [
    "src/sim/hud.ts",
    /^export function hudOf\(/,
  ],
  advance: [
    "src/shell/loop.ts",
    /^export function advance\(/,
  ],
  press: [
    "src/shell/loop.ts",
    /^export function press\(/,
  ],
  drag: [
    "src/shell/loop.ts",
    /^export function drag\(/,
  ],
  release: [
    "src/shell/loop.ts",
    /^export function release\(/,
  ],
  resetRun: [
    "src/shell/loop.ts",
    /^export function resetRun\(/,
  ],
  setPlaying: [
    "src/shell/loop.ts",
    /^export function setPlaying\(/,
  ],
  reduce: [
    "src/flow.ts",
    /^export function reduce\(/,
  ],
  writeCamera: [
    "src/render/camera.ts",
    /^export function writeCamera\(/,
  ],
  greedyBot: [
    "src/bot.ts",
    /^export const greedyBot/,
  ],
  defineLevels: [
    "src/levels.ts",
    /^export function defineLevels\(/,
  ],
  levelSpec: [
    "src/levels.ts",
    /^export const levelSpec/,
  ],
  tierOf: [
    "src/levels.ts",
    /^export const tierOf/,
  ],
  ARCHETYPES: [
    "src/levels.ts",
    /^export const ARCHETYPES/,
  ],
  RAMP: [
    "src/levels.ts",
    /^export const RAMP/,
  ],
};

interface Excerpt {
  readonly id: string;
  readonly file: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly code: string;
  readonly permalink: string;
}

interface GoldenRow {
  readonly n: number;
  readonly hash: string;
  readonly steps: number;
  readonly score: number;
  readonly stars: number;
}

const read = (file: string): Promise<string> =>
  readFile(join(VENDOR, file), "utf8");

/** Same scan as upstream's extract(): brace depth with strings and line comments blanked out. */
function extract(
  sha: string,
  id: string,
  file: string,
  source: string,
  pattern: RegExp,
): Excerpt {
  const lines = source.split("\n");
  const i = lines.findIndex((l) => pattern.test(l));
  if (i < 0) throw new Error(`excerpt not found: ${id} ${file} ${pattern}`);
  let depth = 0;
  let opened = false;
  let j = i;
  for (; j < lines.length; j++) {
    const code = (lines[j] ?? "")
      .replace(/'[^']*'|"[^"]*"|`[^`]*`/g, "")
      .replace(/\/\/.*$/, "");
    for (const ch of code) {
      if (ch === "{") {
        depth++;
        opened = true;
      } else if (ch === "}") depth--;
    }
    if (opened && depth === 0) break;
    if (!opened && /;\s*$/.test(code)) break;
  }
  const body = lines.slice(i, j + 1);
  const indent = Math.min(
    ...body.filter((l) => l.trim()).map((l) => l.match(/^ */)?.[0].length ?? 0),
  );
  const startLine = i + 1;
  const endLine = i + body.length;
  return {
    id,
    file,
    startLine,
    endLine,
    code: body.map((l) => l.slice(indent)).join("\n"),
    permalink: `https://github.com/${REPO}/blob/${sha}/${file}#L${startLine}-L${endLine}`,
  };
}

/** Golden verifier rows: n, hash, steps, score, stars, one per line. */
function golden(text: string): GoldenRow[] {
  return text
    .trim()
    .split("\n")
    .map((line) => {
      const [n, hash, steps, score, stars] = line.trim().split(/\s+/);
      if (!hash) throw new Error(`malformed golden row: ${line}`);
      return {
        n: Number(n),
        hash,
        steps: Number(steps),
        score: Number(score),
        stars: Number(stars),
      };
    });
}

const sha = (await read("VERSION")).split("\n")[0]?.trim() ?? "";
if (!/^[0-9a-f]{40}$/.test(sha))
  throw new Error(`vendor/VERSION has no SHA; run bun scripts/sync-pewpew.ts`);

const sources = new Map<string, string>();
const excerpts: Excerpt[] = [];
for (const [id, [file, pattern]] of Object.entries(EXCERPTS)) {
  let source = sources.get(file);
  if (source === undefined) {
    source = await read(file);
    sources.set(file, source);
  }
  excerpts.push(extract(sha, id, file, source, pattern));
}
const rows = golden(await read("scripts/verify-levels.golden.txt"));

await writeFile(
  join(OUT, "excerpts.json"),
  `${JSON.stringify(excerpts, null, 2)}\n`,
);
await writeFile(join(OUT, "golden.json"), `${JSON.stringify(rows, null, 2)}\n`);
console.log(
  `pewpew: ${excerpts.length} excerpts and ${rows.length} golden rows at ${sha.slice(0, 7)}`,
);
