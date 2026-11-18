// The terminal is a second version of the site, under its own prefix. Every
// page of the regular site has a twin here at the same path after it, so a
// visitor can switch between the two and land on the same thing.

export const TERMINAL = "/terminal";

/** The git client: the terminal's home. */
export const GIT = TERMINAL;
/** The shell tab, which has no twin on the regular site. */
export const SHELL = `${TERMINAL}/shell`;
export const OFFICE = `${TERMINAL}/office`;

/** A page of the regular site ("/blog/x"), as its terminal tab. */
export function toTerminal(path: string) {
  return path === "/" ? TERMINAL : `${TERMINAL}${path}`;
}

/** A terminal tab, as the page of the regular site it stands for. */
export function toSite(path: string) {
  if (path === SHELL || !path.startsWith(TERMINAL)) return "/";
  return path.slice(TERMINAL.length) || "/";
}
