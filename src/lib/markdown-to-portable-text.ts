import { lexer, type Token, type Tokens } from "marked";
import { isContentHref } from "@/lib/https-url";

export type ContentSpan = {
  _type: "span";
  _key: string;
  text: string;
  marks: string[];
};

export type ContentMarkDef = {
  _key: string;
  _type: "link";
  href: string;
};

export type ContentBlock = {
  _type: string;
  _key: string;
  style?: string;
  listItem?: "bullet" | "number";
  level?: number;
  markDefs?: ContentMarkDef[];
  children?: ContentSpan[];
  language?: string;
  code?: string;
  [key: string]: unknown;
};

function markdownToPortableText(markdown: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let key = 0;
  const nextKey = () => `b${key++}`;

  function spansFrom(
    tokens: Token[] | undefined,
    marks: string[],
    markDefs: ContentMarkDef[],
  ): ContentSpan[] {
    if (!tokens) return [];
    const spans: ContentSpan[] = [];
    for (const token of tokens) {
      if (token.type === "text" || token.type === "escape") {
        const nested = "tokens" in token ? token.tokens : undefined;
        if (nested?.length) {
          spans.push(...spansFrom(nested, marks, markDefs));
        } else if (token.text) {
          spans.push({
            _type: "span",
            _key: nextKey(),
            text: token.text,
            marks,
          });
        }
      } else if (token.type === "strong" || token.type === "em") {
        spans.push(
          ...spansFrom(
            token.tokens,
            [
              ...marks,
              token.type === "strong" ? "strong" : "em",
            ],
            markDefs,
          ),
        );
      } else if (token.type === "codespan") {
        spans.push({
          _type: "span",
          _key: nextKey(),
          text: token.text,
          marks: [
            ...marks,
            "code",
          ],
        });
      } else if (token.type === "link") {
        const href = isContentHref(token.href) ? token.href : null;
        if (!href) {
          spans.push(...spansFrom(token.tokens, marks, markDefs));
          continue;
        }
        const markKey = nextKey();
        markDefs.push({
          _key: markKey,
          _type: "link",
          href,
        });
        spans.push(
          ...spansFrom(
            token.tokens,
            [
              ...marks,
              markKey,
            ],
            markDefs,
          ),
        );
      } else if (token.type === "br") {
        spans.push({
          _type: "span",
          _key: nextKey(),
          text: "\n",
          marks,
        });
      } else if ("tokens" in token && token.tokens?.length) {
        spans.push(...spansFrom(token.tokens, marks, markDefs));
      } else if (
        "text" in token &&
        typeof token.text === "string" &&
        token.text
      ) {
        spans.push({
          _type: "span",
          _key: nextKey(),
          text: token.text,
          marks,
        });
      }
    }
    return spans;
  }

  function pushTextBlock(
    tokens: Token[] | undefined,
    style: string,
    list?: {
      listItem: "bullet" | "number";
      level: number;
    },
  ) {
    const markDefs: ContentMarkDef[] = [];
    const children = spansFrom(tokens, [], markDefs);
    if (children.length === 0) return;
    blocks.push({
      _type: "block",
      _key: nextKey(),
      style,
      markDefs,
      children,
      ...(list
        ? {
            listItem: list.listItem,
            level: list.level,
          }
        : {}),
    });
  }

  function walk(
    tokens: Token[],
    list?: {
      listItem: "bullet" | "number";
      level: number;
    },
  ) {
    for (const token of tokens) {
      if (token.type === "space") continue;
      if (token.type === "heading") {
        const style = token.depth <= 2 ? "h2" : "h3";
        pushTextBlock(token.tokens, style, list);
      } else if (token.type === "paragraph" || token.type === "text") {
        pushTextBlock(
          token.tokens ?? [],
          token.type === "paragraph" ? "normal" : "normal",
          list,
        );
      } else if (token.type === "blockquote") {
        const inner = (token.tokens ?? []).filter(
          (child) => child.type !== "space",
        );
        if (inner.length === 0) continue;
        for (const child of inner) {
          if (child.type === "paragraph")
            pushTextBlock(child.tokens, "blockquote", list);
          else
            walk(
              [
                child,
              ],
              list,
            );
        }
      } else if (token.type === "list") {
        const listItem = token.ordered ? "number" : "bullet";
        for (const item of token.items) {
          walk(item.tokens, {
            listItem,
            level: 1,
          });
        }
      } else if (token.type === "code") {
        blocks.push({
          _type: "code",
          _key: nextKey(),
          language: token.lang || "text",
          code: token.text,
        });
      } else if (token.type === "html") {
        const text = token.text.trim();
        if (!text) continue;
        pushTextBlock(
          [
            {
              type: "text",
              raw: text,
              text,
            } satisfies Tokens.Text,
          ],
          "normal",
          list,
        );
      }
    }
  }

  walk(lexer(markdown));
  return blocks;
}

export { markdownToPortableText };
