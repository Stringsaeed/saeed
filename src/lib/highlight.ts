import "server-only";
import { createHighlighter, type Highlighter, type ThemedToken } from "shiki";
import { warnOnceInDev } from "@/lib/dev-warn";
import {
  HIGHLIGHT_LANGUAGES,
  resolveLanguage,
} from "@/lib/highlight-languages";

// Code is highlighted on the server only; the client gets plain spans with
// two colour variables per token and globals.css picks one by theme.

const themes = {
  light: "github-light",
  dark: "github-dark",
} as const;

// In development the module re-evaluates on every HMR update; keeping the
// promise on globalThis stops each reload from starting another highlighter
// (Shiki warns after ten instances).
const cache = globalThis as typeof globalThis & {
  __postHighlighter?: Promise<Highlighter>;
};

function getHighlighter() {
  if (!cache.__postHighlighter) {
    const created = createHighlighter({
      themes: [
        themes.light,
        themes.dark,
      ],
      langs: [
        ...HIGHLIGHT_LANGUAGES,
      ],
    });
    cache.__postHighlighter = created;
    // Let a failed start retry on the next request instead of caching it.
    created.catch(() => {
      if (cache.__postHighlighter === created)
        cache.__postHighlighter = undefined;
    });
  }
  return cache.__postHighlighter;
}

export type HighlightedLine = readonly ThemedToken[];

/**
 * Tokens per line with `--shiki-light` / `--shiki-dark` in `htmlStyle`, or
 * null for plain text (unknown language, or highlighting failed).
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
  } catch (error) {
    warnOnceInDev(
      `highlight:${lang}`,
      `[highlight] Could not highlight ${lang}; rendering plain text. ${String(error)}`,
    );
    return null;
  }
}
