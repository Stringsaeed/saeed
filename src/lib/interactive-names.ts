// The figures a post can embed. Shared by the Sanity schema (options list),
// the markdown converter (`{{name}}` paragraphs), and the client registry, so
// it stays free of React, Next, and Sanity imports.
export const INTERACTIVE_NAMES = [
  "demo-placeholder",
  "pewpew-hero",
  "pewpew-pool",
  "pewpew-step",
  "pewpew-steer",
  "pewpew-frame",
  "pewpew-threads",
  "pewpew-runtimes",
  "pewpew-level",
  "pewpew-track",
  "pewpew-drones",
  "pewpew-boss",
  "pewpew-collide",
  "pewpew-bot",
  "pewpew-proof",
  "pewpew-camera",
  "pewpew-flow",
  "pewpew-sound",
] as const;

export type InteractiveName = (typeof INTERACTIVE_NAMES)[number];

const names: ReadonlySet<string> = new Set(INTERACTIVE_NAMES);

export function isInteractiveName(value: unknown): value is InteractiveName {
  return typeof value === "string" && names.has(value);
}
