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
 * and src/render/* other than camera.ts (WebGPU).
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
