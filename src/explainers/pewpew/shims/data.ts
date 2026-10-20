// Stand-in for the explainer's src/data.ts, which imports the JSON its build.mjs writes. The vendored code.ts and
// figures import this file instead (see PATCHES in scripts/sync-pewpew.ts). Same exports and shapes as upstream, built
// from excerpts.json and golden.json, which scripts/pewpew-excerpts.ts generates from the vendored source.
import excerptsJson from "../excerpts.json";
import goldenJson from "../golden.json";

export interface Excerpt {
  readonly file: string;
  readonly start: number;
  readonly text: string;
}

/** Excerpts from the vendored source by name. Names whose file is not vendored are absent. */
export const EXCERPTS: Record<string, Excerpt> = Object.fromEntries(
  excerptsJson.map((excerpt) => [
    excerpt.id,
    {
      file: excerpt.file,
      start: excerpt.startLine,
      text: excerpt.code,
    },
  ]),
);

export function hasExcerpt(name: string): boolean {
  return Object.hasOwn(EXCERPTS, name);
}

export interface GoldenRow {
  readonly n: number;
  readonly hash: string;
  readonly steps: number;
  readonly score: number;
  readonly stars: number;
}

/** Rows of scripts/verify-levels.golden.txt. */
export const GOLDEN: GoldenRow[] = goldenJson;
