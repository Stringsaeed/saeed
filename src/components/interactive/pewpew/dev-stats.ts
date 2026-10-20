// Dev-only counters for the PewPew figures, on `window.__pewpewFigures`, so
// a browser check can tell whether a figure's loop still runs while it is
// off screen or paused. Production builds skip all of it.

export type PewpewFigureStats = {
  name: string;
  mounted: boolean;
  active: boolean;
  /** Frames and timer ticks the figure has run so far. */
  runs: number;
  /** performance.now() of the last one, or null before the first. */
  lastRunAt: number | null;
};

declare global {
  interface Window {
    __pewpewFigures?: Record<string, PewpewFigureStats>;
  }
}

export function reportFigure(
  name: string,
  stats: Omit<PewpewFigureStats, "name"> | null,
) {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined")
    return;
  window.__pewpewFigures ??= {};
  const all = window.__pewpewFigures;
  if (stats === null) delete all[name];
  else
    all[name] = {
      name,
      ...stats,
    };
}
