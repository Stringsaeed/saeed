// Pure text helpers for agent-facing output. No server-only imports, so the
// test runner can load them directly.

import type {
  ContentBlock,
  ContentSpan,
} from "@/lib/markdown-to-portable-text";

// ---------------------------------------------------------------------------
// Search: a plain term-matching score. Good enough for a site this size, and
// it is deterministic, which makes it easy to test and to explain to agents.
// ---------------------------------------------------------------------------

export type SearchHit<T> = {
  item: T;
  score: number;
};

export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 1);
}

export function scoreText(
  tokens: readonly string[],
  fields: readonly {
    text: string;
    weight: number;
  }[],
): number {
  let score = 0;
  for (const token of tokens) {
    for (const field of fields) {
      if (field.text.toLowerCase().includes(token)) score += field.weight;
    }
  }
  return score;
}

export function search<T>(
  items: readonly T[],
  query: string,
  fieldsOf: (item: T) => {
    text: string;
    weight: number;
  }[],
  limit: number,
): T[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  return items
    .map((item) => ({
      item,
      score: scoreText(tokens, fieldsOf(item)),
    }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((hit) => hit.item);
}

// ---------------------------------------------------------------------------
// Portable text to markdown. Both the markdown routes and the MCP get_post
// tool read the same blocks the HTML page renders, so the text cannot drift.
// ---------------------------------------------------------------------------

function markSpan(span: ContentSpan, defs: ContentBlock["markDefs"]) {
  let text = span.text;
  if (!text) return "";
  if (span.marks.includes("code")) text = `\`${text}\``;
  if (span.marks.includes("strong")) text = `**${text}**`;
  if (span.marks.includes("em")) text = `*${text}*`;
  for (const mark of span.marks) {
    const def = defs?.find((candidate) => candidate._key === mark);
    if (def?._type === "link") text = `[${text}](${def.href})`;
  }
  return text;
}

function inlineMarkdown(block: ContentBlock) {
  return (block.children ?? [])
    .map((span) => markSpan(span, block.markDefs))
    .join("");
}

export function portableTextToMarkdown(body: readonly ContentBlock[]): string {
  const parts: string[] = [];
  let inList = false;

  for (const block of body) {
    const isListItem = block._type === "block" && Boolean(block.listItem);
    // A list ends at the first block that is not a list item.
    if (inList && !isListItem) {
      parts.push("");
      inList = false;
    }

    if (block._type === "block") {
      const text = inlineMarkdown(block);
      if (!text.trim()) continue;
      if (isListItem) {
        const marker = block.listItem === "number" ? "1." : "-";
        const indent = "  ".repeat(Math.max(0, (block.level ?? 1) - 1));
        parts.push(`${indent}${marker} ${text}`);
        inList = true;
        continue;
      }
      const prefix =
        block.style === "h2"
          ? "## "
          : block.style === "h3"
            ? "### "
            : block.style === "blockquote"
              ? "> "
              : "";
      parts.push(`${prefix}${text}`, "");
      continue;
    }

    if (block._type === "code") {
      const language = typeof block.language === "string" ? block.language : "";
      const code = typeof block.code === "string" ? block.code : "";
      parts.push(`\`\`\`${language}`, code.replace(/\n$/, ""), "```", "");
      continue;
    }

    if (block._type === "interactive") {
      const name = typeof block.name === "string" ? block.name : "figure";
      parts.push(`_Interactive figure: ${name} (see the page)._`, "");
    }
  }

  return parts
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// The post slug for a URL path such as /blog/my-post, or null for any other page.
export function postSlugFromPath(pathname: string): string | null {
  const match = /^\/blog\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/.exec(pathname);
  return match?.[1] ?? null;
}
