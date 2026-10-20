// Vendors PewPew's pure simulation code into src/explainers/pewpew/vendor at a pinned commit.
// Usage: bun scripts/sync-pewpew.ts [sha-or-ref]
// With no argument it re-syncs the SHA in vendor/VERSION. A ref that is not a full SHA (a branch or tag) is resolved
// to a commit SHA through the GitHub API first, so VERSION always pins an exact commit.
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "Stringsaeed/pewpew";
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const VENDOR = join(ROOT, "src/explainers/pewpew/vendor");
const VERSION_FILE = join(VENDOR, "VERSION");

/**
 * Every file copied from upstream, at the same relative path. Only pure TypeScript with no React Native import.
 * Not vendored: src/sim/sim.test.ts (upstream's own test), src/save.ts (AsyncStorage), src/audio/* (react-native-audio-api),
 * and src/render/* other than camera.ts (WebGPU). From the explainer: data.ts (it reads build.mjs output; shims/data.ts
 * stands in), figures/hero.ts (WebGPU renderer; the site draws its own hero), and figures/sound.ts (audio engine).
 */
const ALLOWLIST = [
  "src/sim/boss.ts",
  "src/sim/drones.ts",
  "src/sim/hud.ts",
  "src/sim/index.ts",
  "src/sim/input.ts",
  "src/sim/math.ts",
  "src/sim/rules.ts",
  "src/sim/run.ts",
  "src/sim/step.ts",
  "src/sim/track.ts",
  "src/sim/world.ts",
  "src/levels.ts",
  "src/bot.ts",
  "src/flow.ts",
  "src/frameTiming.ts", // imported by src/shell/loop.ts; a plain object of counters
  "src/shell/loop.ts",
  "src/render/camera.ts",
  "scripts/verify-levels.golden.txt",
  "explainer/src/world2d.ts",
  // The explainer's figures, mounted as React islands by src/components/interactive/pewpew/.
  "explainer/src/dom.ts",
  "explainer/src/code.ts",
  "explainer/src/figure.ts",
  "explainer/src/figures/basics.ts",
  "explainer/src/figures/collide.ts",
  "explainer/src/figures/enemies.ts",
  "explainer/src/figures/frame.ts",
  "explainer/src/figures/levels.ts",
  "explainer/src/figures/proof.ts",
  "explainer/src/figures/stepwalk.ts",
  "explainer/src/figures/threads.ts",
  "explainer/src/figures/ui.ts",
] as const;

/**
 * Exact string replacements applied after download. Each must match exactly once, or the sync fails, so an upstream
 * change that invalidates a patch is caught instead of silently skipped. Keep replacements on a single line so
 * vendored line numbers (and the excerpt permalinks built from them) still match upstream.
 */
const PATCHES: readonly {
  file: (typeof ALLOWLIST)[number];
  find: string;
  replace: string;
  why: string;
}[] = [
  {
    file: "src/flow.ts",
    find: "import { isUnlocked, type Save } from './save';",
    replace: "import { isUnlocked, type Save } from '../../shims/save';",
    why: "src/save.ts imports AsyncStorage, so it is not vendored. flow.ts only needs isUnlocked and the Save type, which shims/save.ts provides.",
  },
  {
    file: "explainer/src/code.ts",
    find: "import { EXCERPTS, type Excerpt } from './data';",
    replace: "import { EXCERPTS, type Excerpt } from '../../../shims/data';",
    why: "Upstream's data.ts imports JSON that its build.mjs writes. shims/data.ts serves the same EXCERPTS shape from excerpts.json.",
  },
  {
    file: "explainer/src/figure.ts",
    find: "import { codeView, highlightInto, type CodeView } from './code';",
    replace:
      "import { codeView, highlightInto, type CodeView } from './code'; import { setInterval, clearInterval } from '../../../shims/frames';",
    why: "Runs the walk playback timer in the figure's scope (shims/frames.ts), so it stops while the figure is off screen or paused and is cleared on unmount. The imported names shadow the globals; the two patches below drop the `window.` that would bypass them.",
  },
  {
    file: "explainer/src/figure.ts",
    find: "timer = window.setInterval(opts.next, opts.baseMs / speed);",
    replace: "timer = setInterval(opts.next, opts.baseMs / speed);",
    why: "See the figure.ts import patch.",
  },
  {
    file: "explainer/src/figure.ts",
    find: "if (timer) window.clearInterval(timer);",
    replace: "if (timer) clearInterval(timer);",
    why: "See the figure.ts import patch.",
  },
  {
    file: "explainer/src/figures/basics.ts",
    find: "import { h, svg } from '../dom';",
    replace:
      "import { h, svg } from '../dom'; import { pauseFigure, requestAnimationFrame } from '../../../../shims/frames';",
    why: "poolFigure runs an endless requestAnimationFrame loop with no teardown. The imported name shadows the global, so the loop runs in the figure's scope: held while off screen or paused, dropped on unmount. pauseFigure is for the patch below.",
  },
  {
    file: "explainer/src/figures/basics.ts",
    find: "      pauseBtn,",
    replace: "      null,",
    why: "The pool's own pause pill is not shown; the site's play button in the figure header pauses it instead (through the timer scope).",
  },
  {
    file: "explainer/src/figures/basics.ts",
    find: "        running = false;",
    replace: "        pauseFigure();",
    why: "remove(bodies, 2) paused the pool through the hidden pill's flag, which nothing could then unset. It now pauses through the site's play button, which can resume it.",
  },
  {
    file: "explainer/src/world2d.ts",
    find: "import { ARCHETYPES, BOSSES, Kind } from '../../src/levels';",
    replace:
      "import { ARCHETYPES, BOSSES, Kind } from '../../src/levels'; import { canvasFont } from '../../../shims/canvas';",
    why: "For the font patch below.",
  },
  {
    file: "explainer/src/world2d.ts",
    find: "  ctx.font = '10px \"Paper Mono\", ui-monospace, monospace';",
    replace: "  ctx.font = canvasFont(10);",
    why: 'The site loads Paper Mono through next/font under a generated family name, so the literal "Paper Mono" would fall back. The island reads the real family from the figure\'s CSS at mount.',
  },
  {
    file: "explainer/src/figures/collide.ts",
    find: "import { h } from '../dom';",
    replace:
      "import { h } from '../dom'; import { canvasFont, canvasX, canvasY } from '../../../../shims/canvas';",
    why: "For the font and pointer patches below.",
  },
  {
    file: "explainer/src/figures/collide.ts",
    find: "    ctx.font = '11px \"Paper Mono\", ui-monospace, monospace';",
    replace: "    ctx.font = canvasFont(11);",
    why: "Same as the world2d.ts font patch.",
  },
  {
    file: "explainer/src/figures/collide.ts",
    find: "    rx = (e.clientX - r.left - W / 2) / S;",
    replace: "    rx = (canvasX(cv, e.clientX) - W / 2) / S;",
    why: "The canvas shrinks to fit narrow screens (pewpew-figure.css), so CSS pixels are mapped back to its 330-unit drawing width before hit-testing.",
  },
  {
    file: "explainer/src/figures/collide.ts",
    find: "    ry = -(e.clientY - r.top - H / 2) / S;",
    replace: "    ry = -(canvasY(cv, e.clientY) - H / 2) / S;",
    why: "Same as the rx patch, for the 250-unit drawing height.",
  },
  {
    file: "explainer/src/figures/levels.ts",
    find: "import { GOLDEN } from '../data';",
    replace: "import { GOLDEN } from '../../../../shims/data';",
    why: "Golden rows come from golden.json through shims/data.ts (see the code.ts patch).",
  },
  {
    file: "explainer/src/figures/proof.ts",
    find: "import { GOLDEN } from '../data';",
    replace: "import { GOLDEN } from '../../../../shims/data';",
    why: "Golden rows come from golden.json through shims/data.ts (see the code.ts patch).",
  },
  {
    file: "explainer/src/figures/threads.ts",
    find: "import { codeView } from '../code';",
    replace:
      "import { codeView } from '../code'; import { hasExcerpt } from '../../../../shims/data';",
    why: "Three hops quote files that are not vendored (App.tsx, src/shell/useGpu.ts, src/audio/engine.ts), so their excerpts are missing. See the codeBox patch below.",
  },
  {
    file: "explainer/src/figures/threads.ts",
    find: "codeBox.replaceChildren(hop.code ? codeView(hop.code, { maxHeight: 220 }).el : '');",
    replace:
      "codeBox.replaceChildren(hop.code && hasExcerpt(hop.code) ? codeView(hop.code, { maxHeight: 220 }).el : '');",
    why: "codeView throws on a missing excerpt. A hop whose source is not vendored shows no code instead of failing.",
  },
  {
    file: "explainer/src/figures/ui.ts",
    find: "import { parseSave, recordRun } from '../../../src/save';",
    replace: "import { parseSave, recordRun } from '../../../../shims/save';",
    why: "src/save.ts imports AsyncStorage, so it is not vendored. shims/save.ts copies parseSave and recordRun from it.",
  },
];

async function resolveSha(ref: string): Promise<string> {
  if (/^[0-9a-f]{40}$/.test(ref)) return ref;
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/commits/${encodeURIComponent(ref)}`,
    {
      headers: {
        Accept: "application/vnd.github.sha",
      },
    },
  );
  if (!res.ok)
    throw new Error(`could not resolve ref "${ref}": HTTP ${res.status}`);
  const sha = (await res.text()).trim();
  if (!/^[0-9a-f]{40}$/.test(sha))
    throw new Error(`unexpected SHA for "${ref}": ${sha}`);
  return sha;
}

async function pinnedRef(): Promise<string> {
  const arg = process.argv[2];
  if (arg) return arg;
  const version = await readFile(VERSION_FILE, "utf8").catch(() => null);
  const sha = version?.split("\n")[0]?.trim();
  if (!sha)
    throw new Error(
      `no SHA given and ${VERSION_FILE} is missing; run: bun scripts/sync-pewpew.ts <sha>`,
    );
  return sha;
}

async function download(sha: string, path: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/${REPO}/${sha}/${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

function applyPatches(path: string, source: string): string {
  let out = source;
  for (const patch of PATCHES) {
    if (patch.file !== path) continue;
    const hits = out.split(patch.find).length - 1;
    if (hits !== 1) {
      throw new Error(
        `patch for ${path} matched ${hits} times (expected 1): ${JSON.stringify(patch.find)}\n  why it exists: ${patch.why}`,
      );
    }
    out = out.replace(patch.find, patch.replace);
  }
  return out;
}

const sha = await resolveSha(await pinnedRef());
console.log(`pewpew: syncing ${ALLOWLIST.length} files at ${sha}`);

const results = await Promise.allSettled(
  ALLOWLIST.map(async (path) => ({
    path,
    source: applyPatches(path, await download(sha, path)),
  })),
);
const failures = results.flatMap((r) =>
  r.status === "rejected"
    ? [
        String(r.reason),
      ]
    : [],
);
if (failures.length > 0) {
  console.error(
    `pewpew: sync failed, vendor/ left untouched:\n  ${failures.join("\n  ")}`,
  );
  process.exit(1);
}

await rm(VENDOR, {
  recursive: true,
  force: true,
});
for (const r of results) {
  if (r.status !== "fulfilled") continue;
  const target = join(VENDOR, r.value.path);
  await mkdir(dirname(target), {
    recursive: true,
  });
  await writeFile(target, r.value.source);
}
await writeFile(
  VERSION_FILE,
  `${sha}\nsynced: ${new Date().toISOString()}\nsource: https://github.com/${REPO}/tree/${sha}\n`,
);
console.log(
  `pewpew: wrote ${ALLOWLIST.length} files and VERSION; ${PATCHES.length} patch(es) applied`,
);
