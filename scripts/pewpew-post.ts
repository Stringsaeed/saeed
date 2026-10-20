// Converts the PewPew explainer (explainer/post.md in the pewpew repo, at the SHA pinned in vendor/VERSION) into a
// post draft in this site's Markdown, at src/explainers/pewpew/post.mdx. The draft is not served by the site (only
// src/content/blog is, as a fallback when Sanity returns nothing); it is the source for the Sanity import.
// Usage: bun run pewpew:post [path/to/post.md]
// With no argument it downloads post.md at the pinned SHA. The transform is deterministic: same input, same output.
// Before parsing, `proseEdits` rewords the claims that hold for the repo's explainer but not for this site, and
// HELD_FIGURES keeps figures that are not ported yet out of the post. Captions are attached at import, not here.
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

/**
 * Figures the post leaves out for now, with the sentence that stands in their place. The figure keeps its name and
 * registry entry; to put it back in the post once it is ported, delete its line here.
 */
const HELD_FIGURES: Record<string, string> = {
  sound:
    "The sound figure is still being ported; the audio engine runs on the device only for now.",
};

type ProseEdit = {
  find: string;
  replace: string;
  why: string;
};

/**
 * Exact-string edits to upstream's post.md, for claims that are true of the repo's explainer but not of this site.
 * Applied to the source before parsing, so they can reach notes too. Like the sync script's PATCHES, each `find`
 * must occur exactly once, or the script fails and the edit needs a look.
 */
function proseEdits(sha: string): ProseEdit[] {
  const commit = `[${sha.slice(0, 7)}](https://github.com/${REPO}/tree/${sha})`;
  return [
    {
      why: "This site copies excerpts at a pinned commit; it does not read them from the source at build time.",
      find: "every code excerpt is read from the source with its real line number.",
      replace:
        "every code excerpt is copied from the source at a pinned commit, with its real line number.",
    },
    {
      why: "Note 1 says the post follows the code. Here the excerpts and figures are pinned and re-synced on purpose.",
      find: "^[`explainer/build.mjs` bundles the modules under `src/` with esbuild and reads each excerpt from disk at build time. When the code changes, the post changes with it.]",
      replace: `^[The excerpts and figures in this post are pinned to commit ${commit} and re-synced on purpose, so a change to the game reaches this post only when it is synced. The repo's own explainer reads each excerpt from disk at build time, so it follows the code.]`,
    },
    {
      why: "step() runs a guard, then ten stages; the walkthrough shows all eleven, so the prose counts the guard too.",
      find: "One call to `step(world, input, events)` advances the world one step by calling ten stages, and their order is the game's rules.",
      replace:
        "One call to `step(world, input, events)` advances the world one step. A guard stops a finished run and records where every body was, then ten stages run, and their order is the game's rules.",
    },
    {
      why: "The walkthrough has eleven steps: the guard plus the ten stages.",
      find: "The walkthrough runs those stages one at a time on a real world.",
      replace:
        "The walkthrough runs the guard and the ten stages one at a time on a real world, eleven steps in all.",
    },
    {
      why: "Note 4 says the hero runs the game's renderer. Here the hero is the 2D sim view, without WebGPU.",
      find: "That is why the hero figure can run the game's renderer unchanged.]",
      replace:
        "That is why the repo's own explainer can run the game's renderer unchanged in a browser. The hero figure here is the 2D sim view; the WebGPU renderer runs in the app and in that explainer.]",
    },
  ];
}

/** Applies each edit once, and fails if its `find` does not occur exactly once. */
function applyProseEdits(source: string, edits: ProseEdit[]) {
  let out = source;
  for (const edit of edits) {
    const count = out.split(edit.find).length - 1;
    if (count !== 1) {
      throw new Error(
        `Prose edit matched ${count} times, expected 1 (${edit.why}): ${edit.find.slice(0, 80)}`,
      );
    }
    out = out.replace(edit.find, () => edit.replace);
  }
  return out;
}

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

/**
 * The same note pattern as build.mjs: one level of nested brackets, so a note can hold a link. Spaces before the
 * marker are taken too, because the marker is rejoined to the word before it.
 */
const NOTE_PATTERN = /[ \t]*\^\[((?:[^[\]]|\[[^\]]*\])+)\]/g;

/** Joins a note marker to the word before it, so `[5]` never wraps onto a line of its own. */
const NOTE_JOIN = " ";

function main(source: string, sha: string, excerpts: Map<string, Excerpt>) {
  const blocks = parseBlocks(applyProseEdits(source, proseEdits(sha)));
  const notes: string[] = [];
  const unported: string[] = [];
  const figuresSeen: string[] = [];
  const figuresHeld: string[] = [];

  /** Replaces each ^[note] with [n] and collects the note. Rejects anything marked would read differently. */
  function inline(text: string) {
    const out = text.replace(NOTE_PATTERN, (_, note: string) => {
      notes.push(note.replace(/\s+/g, " ").trim());
      return `${NOTE_JOIN}[${notes.length}]`;
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
        const held = HELD_FIGURES[block.name];
        if (held !== undefined) {
          figuresHeld.push(block.name);
          out.push(inline(held));
          break;
        }
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

  for (const name of Object.keys(HELD_FIGURES)) {
    if (!figuresHeld.includes(name))
      throw new Error(
        `HELD_FIGURES lists ${name}, which the post does not place`,
      );
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
    held: figuresHeld,
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
  `wrote ${OUT_FILE}: title "${result.title}", ${result.figures.length} figures (held back: ${result.held.join(", ") || "none"}), ${result.notes} notes, unported excerpts used: ${result.unported.join(", ") || "none"}`,
);
