// Imports the PewPew post draft (src/explainers/pewpew/post.mdx, made by `bun run pewpew:post`) into Sanity as a DRAFT
// `post` document. Publish it from the Studio after review.
// Usage: bun run pewpew:import [--dry-run] [--publish --yes-publish-live]
//   --dry-run   build and validate the document, write the JSON, and skip the upload.
//   --publish   write the published id instead of the draft. Refused unless --yes-publish-live is also given, because
//               the site reads published posts straight away.
// The upload goes through `sanity documents create --replace`, so it uses the Sanity CLI's own login and the project
// and dataset from src/sanity/env.ts; this script never reads a token.
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { withPewpewCaptions } from "../src/explainers/pewpew/captions";
import { CODE_LANGUAGE_OPTIONS } from "../src/lib/highlight-languages";
import { isContentHref } from "../src/lib/https-url";
import { isInteractiveName } from "../src/lib/interactive-names";
import { parseLocalPost } from "../src/lib/local-posts";
import type { ContentBlock } from "../src/lib/markdown-to-portable-text";
import { dataset, projectId } from "../src/sanity/env";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SOURCE = join(ROOT, "src/explainers/pewpew/post.mdx");
const SLUG = "pewpew-source-tour";
const PUBLISHED_ID = `post-${SLUG}`;
const DRAFT_ID = `drafts.${PUBLISHED_ID}`;

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const publish = args.has("--publish");
if (publish && !args.has("--yes-publish-live")) {
  throw new Error(
    "--publish writes the live post. Add --yes-publish-live to confirm, or publish the draft from the Studio.",
  );
}

const STYLES = new Set([
  "normal",
  "h2",
  "h3",
  "blockquote",
]);
const DECORATORS = new Set([
  "strong",
  "em",
  "code",
]);
const LANGUAGES = new Set<string>(
  CODE_LANGUAGE_OPTIONS.map((option) => option.value),
);

/** Gives `item` a key if it has none, unique within its array, and fails on duplicates. */
function keyed<
  T extends {
    _key?: unknown;
  },
>(
  items: T[],
  prefix: string,
): (T & {
  _key: string;
})[] {
  const seen = new Set<string>();
  return items.map((item, index) => {
    const key =
      typeof item._key === "string" && item._key
        ? item._key
        : `${prefix}${index}`;
    if (seen.has(key)) throw new Error(`Duplicate _key ${key} in ${prefix}`);
    seen.add(key);
    return {
      ...item,
      _key: key,
    };
  });
}

/** Maps the converter's blocks onto the post schema (src/sanity/schemaTypes/content.ts) and rejects anything else. */
function toSanityBody(blocks: ContentBlock[]) {
  return keyed(blocks, "body").map((block) => {
    switch (block._type) {
      case "block": {
        if (!STYLES.has(block.style ?? "")) {
          throw new Error(`Block ${block._key} has style ${block.style}`);
        }
        const markDefs = keyed(block.markDefs ?? [], `${block._key}m`).map(
          (def) => {
            if (def._type !== "link" || !isContentHref(def.href)) {
              throw new Error(
                `Block ${block._key} has a bad link: ${def.href}`,
              );
            }
            return {
              _key: def._key,
              _type: "link",
              href: def.href,
            };
          },
        );
        const defKeys = new Set(markDefs.map((def) => def._key));
        const children = keyed(block.children ?? [], `${block._key}s`).map(
          (span) => {
            for (const mark of span.marks) {
              if (!DECORATORS.has(mark) && !defKeys.has(mark)) {
                throw new Error(`Span ${span._key} has unknown mark ${mark}`);
              }
            }
            return {
              _key: span._key,
              _type: "span",
              text: span.text,
              marks: span.marks,
            };
          },
        );
        if (children.length === 0) {
          throw new Error(`Block ${block._key} has no text`);
        }
        return {
          _key: block._key,
          _type: "block",
          style: block.style,
          markDefs,
          children,
          ...(block.listItem
            ? {
                listItem: block.listItem,
                level: block.level ?? 1,
              }
            : {}),
        };
      }
      case "code": {
        if (!LANGUAGES.has(block.language ?? "")) {
          throw new Error(
            `Code block ${block._key} has language ${block.language}, which the Studio does not offer`,
          );
        }
        if (typeof block.code !== "string") {
          throw new Error(`Code block ${block._key} has no code`);
        }
        return {
          _key: block._key,
          _type: "code",
          language: block.language,
          code: block.code,
        };
      }
      case "interactive": {
        if (!isInteractiveName(block.name)) {
          throw new Error(`Unknown interactive figure: ${String(block.name)}`);
        }
        return {
          _key: block._key,
          _type: "interactive",
          name: block.name,
          ...(typeof block.caption === "string" && block.caption
            ? {
                caption: block.caption,
              }
            : {}),
        };
      }
      default:
        throw new Error(`The post schema has no block type ${block._type}`);
    }
  });
}

const post = parseLocalPost(SLUG, await readFile(SOURCE, "utf8"));
const document = {
  _id: publish ? PUBLISHED_ID : DRAFT_ID,
  _type: "post",
  title: post.title,
  slug: {
    _type: "slug",
    current: SLUG,
  },
  description: post.description,
  date: post.date,
  tags: [
    ...post.tags,
  ],
  // post.mdx has no captions; each figure gets its caption from src/explainers/pewpew/captions.ts here.
  body: toSanityBody(withPewpewCaptions(post.body)),
};

const dir = await mkdtemp(join(tmpdir(), "pewpew-import-"));
const file = join(dir, `${document._id}.json`);
await writeFile(file, `${JSON.stringify(document, null, 2)}\n`);

const count = (type: string) =>
  document.body.filter((block) => block._type === type).length;
const uncaptioned = document.body.filter(
  (block) => block._type === "interactive" && !("caption" in block),
);
if (uncaptioned.length > 0) {
  throw new Error(
    `Interactive blocks without a caption: ${uncaptioned.map((block) => block._key).join(", ")}`,
  );
}
console.log(
  `${document._id}: ${document.body.length} blocks, ${count("interactive")} interactive (all captioned), ${count("code")} code; JSON at ${file}`,
);

if (dryRun) {
  console.log("--dry-run: not uploaded");
} else {
  const result = spawnSync(
    "bunx",
    [
      "sanity",
      "documents",
      "create",
      file,
      "--replace",
      "--project-id",
      projectId,
      "--dataset",
      dataset,
    ],
    {
      cwd: ROOT,
      stdio: "inherit",
    },
  );
  if (result.status !== 0) {
    throw new Error(`sanity documents create exited with ${result.status}`);
  }
  console.log(
    `${publish ? "Published" : "Draft written"}: ${document._id} in ${projectId}/${dataset}`,
  );
}
