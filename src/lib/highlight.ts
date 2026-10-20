import "server-only";
import { createHighlighter, type Highlighter, type ThemedToken } from "shiki";

// Code is highlighted on the server only; the client gets plain spans with
// two colour variables per token and globals.css picks one by theme.

const languages = [
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

const aliases: Record<string, (typeof languages)[number]> = {
  typescript: "ts",
  javascript: "js",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  kt: "kotlin",
  jsonc: "json",
};

const themes = {
  light: "github-light",
  dark: "github-dark",
} as const;

let highlighter: Promise<Highlighter> | undefined;

function getHighlighter() {
  if (!highlighter) {
    highlighter = createHighlighter({
      themes: [
        themes.light,
        themes.dark,
      ],
      langs: [
        ...languages,
      ],
    });
    // Let a failed start retry on the next request instead of caching it.
    highlighter.catch(() => {
      highlighter = undefined;
    });
  }
  return highlighter;
}

export function resolveLanguage(language: unknown) {
  if (typeof language !== "string") return null;
  const name = language.trim().toLowerCase();
  if ((languages as readonly string[]).includes(name))
    return name as (typeof languages)[number];
  return aliases[name] ?? null;
}

export type HighlightedLine = readonly ThemedToken[];

/**
 * Tokens per line with `--shiki-light` / `--shiki-dark` in `htmlStyle`, or
 * null for an unknown language (render it as plain text).
 */
export async function highlight(
  code: string,
  language: unknown,
): Promise<readonly HighlightedLine[] | null> {
  const lang = resolveLanguage(language);
  if (!lang) return null;
  try {
    const instance = await getHighlighter();
    return instance.codeToTokens(code, {
      lang,
      themes,
      defaultColor: false,
    }).tokens;
  } catch {
    return null;
  }
}
