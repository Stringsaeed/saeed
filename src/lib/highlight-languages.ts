// Languages the server highlighter loads, and the names authors may use for
// them. Framework-free so the Sanity schema and tests can import it.

export const HIGHLIGHT_LANGUAGES = [
  "ts",
  "tsx",
  "js",
  "jsx",
  "json",
  "bash",
  "swift",
  "kotlin",
  "css",
  "html",
  "wgsl",
] as const;

export type HighlightLanguage = (typeof HIGHLIGHT_LANGUAGES)[number];

const aliases: Record<string, HighlightLanguage> = {
  typescript: "ts",
  javascript: "js",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  kt: "kotlin",
  jsonc: "json",
};

/** Choices offered in the Studio's code block. `plaintext` is not
 *  highlighted; everything else maps onto HIGHLIGHT_LANGUAGES. */
export const CODE_LANGUAGE_OPTIONS = [
  {
    title: "TypeScript",
    value: "ts",
  },
  {
    title: "TSX",
    value: "tsx",
  },
  {
    title: "JavaScript",
    value: "js",
  },
  {
    title: "JSON",
    value: "json",
  },
  {
    title: "Bash",
    value: "bash",
  },
  {
    title: "Swift",
    value: "swift",
  },
  {
    title: "Kotlin",
    value: "kotlin",
  },
  {
    title: "CSS",
    value: "css",
  },
  {
    title: "HTML",
    value: "html",
  },
  {
    title: "WGSL",
    value: "wgsl",
  },
  {
    title: "Plain text",
    value: "plaintext",
  },
] as const;

/** The highlighter language for an author-supplied name, or null for plain
 *  text (unknown, empty, or `plaintext`). */
export function resolveLanguage(language: unknown): HighlightLanguage | null {
  if (typeof language !== "string") return null;
  const name = language.trim().toLowerCase();
  if ((HIGHLIGHT_LANGUAGES as readonly string[]).includes(name))
    return name as HighlightLanguage;
  return aliases[name] ?? null;
}
