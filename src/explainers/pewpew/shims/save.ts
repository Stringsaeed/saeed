// Stand-in for PewPew's src/save.ts, which is not vendored because it imports AsyncStorage. The vendored flow.ts
// imports this file instead (see PATCHES in scripts/sync-pewpew.ts). It holds only what flow.ts uses, copied from
// upstream src/save.ts; if flow.ts starts importing more from save.ts, the type check fails here first.
import type { LevelNumber } from "../vendor/src/levels";
import type { Stars } from "../vendor/src/sim";

export interface LevelRecord {
  readonly best: number;
  readonly stars: 0 | Stars;
}

/** Unlock state is derived by isUnlocked, never stored. */
export interface Save {
  readonly v: 1;
  readonly levels: readonly LevelRecord[];
  readonly music: boolean;
  readonly sfx: boolean;
}

export function isUnlocked(s: Save, n: LevelNumber): boolean {
  return n === 1 || s.levels[n - 2].stars > 0;
}
