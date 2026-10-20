// Stable ids for post headings, following github-slugger: lowercase, drop
// punctuation, spaces become hyphens, and repeats get `-1`, `-2`, … in
// document order. Matching GitHub keeps links people copy from a draft or a
// README working here. Two deliberate differences: text is trimmed first,
// and a heading with no sluggable text becomes `section`.

type HeadingSource = {
  _type?: unknown;
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

/** Plain text of a portable-text block's spans. */
export function blockText(block: { children?: unknown }) {
  if (!Array.isArray(block.children)) return "";
  return block.children
    .map((child) =>
      child && typeof child === "object" && "text" in child
        ? String(child.text)
        : "",
    )
    .join("");
}

/**
 * Maps each h2/h3 block object to its id. Keyed by object rather than
 * `_key`, which is only unique within one array (a callout body can repeat
 * a key from the post). Walks nested bodies in reading order so ids stay
 * unique across the whole post.
 */
export function headingIds(blocks: readonly HeadingSource[]) {
  const slug = createSlugger();
  const ids = new WeakMap<object, string>();

  const walk = (list: readonly HeadingSource[]) => {
    for (const block of list) {
      if (!block || typeof block !== "object") continue;
      if (
        block._type === "block" &&
        typeof block.style === "string" &&
        headingStyles.has(block.style)
      ) {
        ids.set(block, slug(blockText(block)));
      }
      if (Array.isArray(block.body)) walk(block.body);
    }
  };

  walk(blocks);
  return ids;
}
