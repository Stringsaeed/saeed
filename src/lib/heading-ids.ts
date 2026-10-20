// Stable ids for post headings, following github-slugger: lowercase, drop
// punctuation, spaces become hyphens, and repeats get `-1`, `-2`, … in
// document order. Matching GitHub keeps links people copy from a draft or a
// README working here.

type HeadingSource = {
  _type?: unknown;
  _key?: unknown;
  style?: unknown;
  children?: unknown;
  body?: unknown;
};

const strip = /[^\p{L}\p{M}\p{N}\p{Pc} -]/gu;

export function slugify(text: string) {
  return text.toLowerCase().trim().replace(strip, "").replace(/ /g, "-");
}

export function createSlugger() {
  const occurrences = new Map<string, number>();

  return (text: string) => {
    const original = slugify(text) || "section";
    let slug = original;
    while (occurrences.has(slug)) {
      const count = (occurrences.get(original) ?? 0) + 1;
      occurrences.set(original, count);
      slug = `${original}-${count}`;
    }
    occurrences.set(slug, 0);
    return slug;
  };
}

export const headingStyles: ReadonlySet<string> = new Set([
  "h2",
  "h3",
]);

function blockText(children: unknown) {
  if (!Array.isArray(children)) return "";
  return children
    .map((child) =>
      child && typeof child === "object" && "text" in child
        ? String(child.text)
        : "",
    )
    .join("");
}

/**
 * Maps each h2/h3 block `_key` to its id. Walks nested bodies (callouts) in
 * reading order so ids stay unique across the whole post.
 */
export function headingIds(blocks: readonly HeadingSource[]) {
  const slug = createSlugger();
  const ids = new Map<string, string>();

  const walk = (list: readonly HeadingSource[]) => {
    for (const block of list) {
      if (!block || typeof block !== "object") continue;
      if (
        block._type === "block" &&
        typeof block.style === "string" &&
        headingStyles.has(block.style) &&
        typeof block._key === "string"
      ) {
        ids.set(block._key, slug(blockText(block.children)));
      }
      if (Array.isArray(block.body)) walk(block.body);
    }
  };

  walk(blocks);
  return ids;
}
