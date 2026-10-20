// Converts the PewPew explainer (explainer/post.md in the pewpew repo, at the SHA pinned in vendor/VERSION) into a
// post draft in this site's Markdown, at src/explainers/pewpew/post.mdx. The draft is not served by the site (only
// src/content/blog is, as a fallback when Sanity returns nothing); it is the source for the Sanity import.
// Usage: bun run pewpew:post [path/to/post.md]
// With no argument it downloads post.md at the pinned SHA. The transform is deterministic: same input, same output.
//
// The explainer's dialect (explainer/build.mjs, `markdown` and `inline`):
// - Blocks: `#` title, `##` / `###` headings, paragraphs (consecutive lines, joined with a space), `- ` and `1. ` lists
//   (continuation lines indented by two or more spaces), `> ` quotes, ``` fences (language defaults to ts), and
//   `{{name}}` on its own line, which places a figure. `{{code:Name}}` is a figure that shows the excerpt `Name`.
// - Inline: `code`, **strong**, *em*, [text](url), and ^[note]. Notes are numbered in reading order and listed at the end.
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "Stringsaeed/pewpew";
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PEWPEW = join(ROOT, "src/explainers/pewpew");
const OUT_FILE = join(PEWPEW, "post.mdx");

const FALLBACK_TITLE = "PewPew, a source tour";
const DESCRIPTION =
  "A tour of the pewpew source, from one step of a pure simulation to the thread that plays the sound, with figures that run the game's own code.";
const DATE = "2026-10-21T00:00:00.000Z";
const TAGS = [
  "React Native",
  "WebGPU",
  "Games",
] as const;

/** Explainer figure name to the site's interactive block name. Every figure in the post must be listed here. */
const FIGURES: Record<string, string> = {
  hero: "pewpew-hero",
  pool: "pewpew-pool",
  step: "pewpew-step",
  steer: "pewpew-steer",
  frame: "pewpew-frame",
  threads: "pewpew-threads",
  runtimes: "pewpew-runtimes",
  level: "pewpew-level",
  track: "pewpew-track",
  drones: "pewpew-drones",
  boss: "pewpew-boss",
  collide: "pewpew-collide",
  bot: "pewpew-bot",
  proof: "pewpew-proof",
  camera: "pewpew-camera",
  flow: "pewpew-flow",
  sound: "pewpew-sound",
};

/** Excerpts upstream defines but this site does not port, because their files are not vendored. */
const UNPORTED_EXCERPTS: Record<string, string> = {
  recordRun: "src/save.ts",
  isUnlocked: "src/save.ts",
  pump: "src/audio/engine.ts",
  playSfx: "src/audio/engine.ts",
  begin: "src/audio/engine.ts",
  EVENT_SFX: "src/audio/data.ts",
  appSinks: "App.tsx",
  gpuFrame: "src/shell/useGpu.ts",
  gpuInit: "src/shell/useGpu.ts",
};

type Excerpt = {
  id: string;
  file: string;
  startLine: number;
  endLine: number;
  code: string;
  permalink: string;
};

type Block =
  | {
      type: "fence";
      lang: string;
      body: string;
    }
  | {
      type: "figure";
      name: string;
    }
  | {
      type: "heading";
      level: number;
      text: string;
    }
  | {
      type: "list";
      ordered: boolean;
      items: string[];
    }
  | {
      type: "quote";
      text: string;
    }
  | {
      type: "paragraph";
      text: string;
    };

/** Splits the post into blocks with the same rules as build.mjs `markdown()`. */
function parseBlocks(md: string): Block[] {
  const blocks: Block[] = [];
  const lines = md.replace(/\r/g, "").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim() || "ts";
      const body: string[] = [];
      for (i++; i < lines.length && !lines[i].startsWith("```"); i++)
        body.push(lines[i]);
      i++;
      blocks.push({
        type: "fence",
        lang,
        body: body.join("\n"),
      });
      continue;
    }
    const fig = line.match(/^\{\{([\w:-]+)\}\}\s*$/);
    if (fig) {
      blocks.push({
        type: "figure",
        name: fig[1],
      });
      i++;
      continue;
    }
    const h = line.match(/^(#{1,3}) (.*)$/);
    if (h) {
      blocks.push({
        type: "heading",
        level: h[1].length,
        text: h[2],
      });
      i++;
      continue;
    }
    if (/^(- |\d+\. )/.test(line)) {
      const ordered = /^\d+\. /.test(line);
      const items: string[] = [];
      while (i < lines.length && /^(- |\d+\. )/.test(lines[i])) {
        let item = lines[i].replace(/^(- |\d+\. )/, "");
        i++;
        while (i < lines.length && /^ {2,}\S/.test(lines[i])) {
          item += ` ${lines[i].trim()}`;
          i++;
        }
        items.push(item);
      }
      blocks.push({
        type: "list",
        ordered,
        items,
      });
      continue;
    }
    if (line.startsWith("> ")) {
      const body: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        body.push(lines[i].slice(2));
        i++;
      }
      blocks.push({
        type: "quote",
        text: body.join(" "),
      });
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,3} |```|- |\d+\. |> |\{\{)/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    if (para.length === 0) {
      para.push(line);
      i++;
    }
    blocks.push({
      type: "paragraph",
      text: para.join(" "),
    });
  }
  return blocks;
}

/** The same note pattern as build.mjs: one level of nested brackets, so a note can hold a link. */
const NOTE_PATTERN = /\^\[((?:[^[\]]|\[[^\]]*\])+)\]/g;

function main(source: string, sha: string, excerpts: Map<string, Excerpt>) {
  const blocks = parseBlocks(source);
  const notes: string[] = [];
  const unported: string[] = [];
  const figuresSeen: string[] = [];

  /** Replaces each ^[note] with [n] and collects the note. Rejects anything marked would read differently. */
  function inline(text: string) {
    const out = text.replace(NOTE_PATTERN, (_, note: string) => {
      notes.push(note.replace(/\s+/g, " ").trim());
      return `[${notes.length}]`;
    });
    if (out.includes("^["))
      throw new Error(`Unterminated note in: ${text.slice(0, 80)}`);
    // A bracketed number followed by ( or [ or : would become a link or a reference definition.
    if (/\[\d+\][([:]/.test(out))
      throw new Error(`Note marker would parse as a link: ${out.slice(0, 80)}`);
    const prose = out.replace(/`[^`]+`/g, "");
    if (/[<\\|]|!\[|_\S/.test(prose))
      throw new Error(
        `Construct the site cannot represent as-is: ${out.slice(0, 80)}`,
      );
    return out;
  }

  const titleBlock = blocks.find(
    (block) => block.type === "heading" && block.level === 1,
  );
  const title =
    titleBlock?.type === "heading" ? titleBlock.text.trim() : FALLBACK_TITLE;

  // The explainer numbers nothing in its source; only keep "01" prefixes if the prose points at section numbers.
  const numberHeadings = /\bsection\s+\d+/i.test(source);
  let sectionN = 0;

  const out: string[] = [
    `Every figure in this post runs the game's own TypeScript, from the [pewpew repo](https://github.com/${REPO}). The live version of this explainer is in the repo's [\`explainer/\` folder](https://github.com/${REPO}/tree/main/explainer).`,
  ];

  for (const block of blocks) {
    switch (block.type) {
      case "heading": {
        if (block === titleBlock) break;
        let text = inline(block.text);
        if (numberHeadings && block.level === 2) {
          sectionN += 1;
          text = `${String(sectionN).padStart(2, "0")} ${text}`;
        }
        out.push(`${"#".repeat(block.level)} ${text}`);
        break;
      }
      case "fence":
        out.push(`\`\`\`${block.lang}\n${block.body}\n\`\`\``);
        break;
      case "figure": {
        const code = block.name.match(/^code:(\w+)$/);
        if (code) {
          const id = code[1];
          const excerpt = excerpts.get(id);
          if (excerpt) {
            out.push(`\`\`\`ts\n${excerpt.code}\n\`\`\``);
            out.push(
              `[${excerpt.file}:${excerpt.startLine}-${excerpt.endLine}](${excerpt.permalink})`,
            );
          } else if (UNPORTED_EXCERPTS[id]) {
            const file = UNPORTED_EXCERPTS[id];
            unported.push(id);
            out.push(
              `\`\`\`ts\n// excerpt ${id} lives in ${file}, see repo\n\`\`\``,
            );
            out.push(
              `[${file}](https://github.com/${REPO}/blob/${sha}/${file})`,
            );
          } else {
            throw new Error(`Unknown code excerpt: ${id}`);
          }
          break;
        }
        const name = FIGURES[block.name];
        if (!name) throw new Error(`Unknown figure: ${block.name}`);
        figuresSeen.push(block.name);
        out.push(`{{${name}}}`);
        break;
      }
      case "list":
        out.push(
          block.items
            .map(
              (item, index) =>
                `${block.ordered ? `${index + 1}.` : "-"} ${inline(item)}`,
            )
            .join("\n"),
        );
        break;
      case "quote":
        out.push(`> ${inline(block.text)}`);
        break;
      case "paragraph":
        out.push(inline(block.text));
        break;
    }
  }

  if (notes.length > 0) {
    out.push("## Notes");
    out.push(
      notes
        .map((note, index) => `${index + 1}. ${inline(note).trim()}`)
        .join("\n"),
    );
  }

  const frontmatter = [
    "---",
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(DESCRIPTION)}`,
    `date: ${JSON.stringify(DATE)}`,
    "tags:",
    ...TAGS.map((tag) => `  - ${tag}`),
    "---",
  ].join("\n");

  return {
    text: `${frontmatter}\n${out.join("\n\n")}\n`,
    title,
    notes: notes.length,
    figures: figuresSeen,
    unported,
  };
}

const sha = (await readFile(join(PEWPEW, "vendor/VERSION"), "utf8"))
  .split("\n")[0]
  .trim();
if (!/^[0-9a-f]{40}$/.test(sha))
  throw new Error(`vendor/VERSION does not start with a SHA: ${sha}`);

const input = process.argv[2];
let source: string;
if (input) {
  source = await readFile(input, "utf8");
} else {
  const url = `https://raw.githubusercontent.com/${REPO}/${sha}/explainer/post.md`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  source = await response.text();
}

const excerptList = JSON.parse(
  await readFile(join(PEWPEW, "excerpts.json"), "utf8"),
) as Excerpt[];
const excerpts = new Map(
  excerptList.map((excerpt) => [
    excerpt.id,
    excerpt,
  ]),
);

if (DESCRIPTION.length > 160)
  throw new Error(
    `Description is ${DESCRIPTION.length} characters; keep it to 160.`,
  );

const result = main(source, sha, excerpts);
await writeFile(OUT_FILE, result.text);
console.log(
  `wrote ${OUT_FILE}: title "${result.title}", ${result.figures.length} figures, ${result.notes} notes, unported excerpts used: ${result.unported.join(", ") || "none"}`,
);
