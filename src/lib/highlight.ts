import "server-only";
import { codeToTokens, type ThemedToken } from "@pierre/highlights";
import githubDark from "@pierre/highlights/themes/github-dark";
import githubLight from "@pierre/highlights/themes/github-light";
import { warnOnceInDev } from "@/lib/dev-warn";
import { resolveLanguage } from "@/lib/highlight-languages";

// Code is highlighted on the server only; the client gets plain spans with
// two colour variables per token and globals.css picks one by theme.
// @pierre/highlights inlines its WebAssembly lexers and initialises on
// import, so there is no highlighter to create or cache.

const themes = {
  light: githubLight,
  dark: githubDark,
};

export type HighlightedLine = readonly ThemedToken[];

/**
 * Tokens per line with `--hl-light` / `--hl-dark` in `htmlStyle`, or null
 * for plain text (unknown language, or highlighting failed).
 */
export function highlight(
  code: string,
  language: unknown,
): readonly HighlightedLine[] | null {
  const lang = resolveLanguage(language);
  if (!lang) return null;
  try {
    return codeToTokens(code, {
      lang,
      themes,
      defaultColor: false,
      cssVariablePrefix: "--hl-",
    }).tokens;
  } catch (error) {
    warnOnceInDev(
      `highlight:${lang}`,
      `[highlight] Could not highlight ${lang}; rendering plain text. ${String(error)}`,
    );
    return null;
  }
}
