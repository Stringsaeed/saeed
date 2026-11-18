import { OFFICE } from "./paths";
import type { Item, Pane } from "./repo";
import {
  CATS,
  CONTACT,
  FOCUS_SENTENCE,
  INTRO,
  LIBRARY,
  SHIPPED,
  SIDE,
  type SiteData,
  shortDate,
  THINGS_SENTENCE,
  WORK,
} from "./site-data";

// The site as a home directory for the shell tab: every section is a text
// file, every post is a markdown file, and ~/bin holds one short script per
// section so nobody has to know `cat` to read the site. `git` is a script
// too, and prints the same history the git client draws.

export const HOME = "/home/saeed";

const ESC = "\x1b";

function rgb(hex: string, text: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  return `${ESC}[38;2;${value >> 16};${(value >> 8) & 255};${value & 255}m${text}${ESC}[0m`;
}

const tint = {
  main: (text: string) => rgb("#9c9bff", text),
  writing: (text: string) => rgb("#f0a03c", text),
  dim: (text: string) => rgb("#7d7a72", text),
  green: (text: string) => rgb("#a6d977", text),
  cyan: (text: string) => rgb("#84cbd9", text),
  amber: (text: string) => rgb("#e9c46a", text),
  bold: (text: string) => `${ESC}[1m${text}${ESC}[0m`,
};

/** A hyperlink the terminal keeps clickable (OSC 8). */
function link(href: string, text: string) {
  return `${ESC}]8;;${href}${ESC}\\${tint.cyan(text)}${ESC}]8;;${ESC}\\`;
}

/** The scripts in ~/bin, in the order the buttons show them. */
export const SCRIPTS = [
  {
    run: "about",
    says: "who I am",
  },
  {
    run: "work",
    says: "where I have worked",
  },
  {
    run: "apps",
    says: "what I have shipped, and side projects",
  },
  {
    run: "blog",
    says: "every post; then: post <name>",
  },
  {
    run: "links",
    says: "the links archive",
  },
  {
    run: "books",
    says: "what is on the shelf",
  },
  {
    run: "contact",
    says: "how to reach me",
  },
  {
    run: "cats",
    says: "Bosha and Sono",
  },
  {
    run: "git log",
    says: "the whole history, as a graph",
  },
] as const;

function script(body: string) {
  return `#!/bin/bash\n${body}\n`;
}

// `git log --graph --oneline`, drawn from the same commits as the client.
function graph(log: readonly Item[]) {
  const lastPost = log.findLastIndex((entry) => entry.lane === "writing");
  const lines: string[] = [];
  const star = (lane: Item["lane"]) =>
    lane === "writing" ? tint.writing("*") : tint.main("*");
  for (const [index, entry] of log.entries()) {
    const beside = index > 0 && index <= lastPost;
    const lanes = !beside
      ? star("main")
      : entry.lane === "writing"
        ? `${tint.main("|")} ${star("writing")}`
        : `${star("main")} ${tint.writing("|")}`;
    const refs = entry.refs
      ? `${tint.cyan(`(${entry.refs.replace("→", "->")})`)} `
      : "";
    const tags = entry.tags?.length
      ? ` ${tint.amber(`(tag: ${entry.tags.join(", ")})`)}`
      : "";
    const type = entry.type ? tint.dim(`${entry.type}: `) : "";
    lines.push(
      `${lanes} ${tint.dim(entry.hash ?? "")} ${refs}${type}${entry.label}${tags}`,
    );
    if (index === 0 && lastPost > 0)
      lines.push(`${tint.main("|")}${tint.writing("\\")}`);
    if (index === lastPost) lines.push(`${tint.main("|")}${tint.writing("/")}`);
  }
  return `${lines.join("\n")}\n`;
}

function listing(pane: Pane | undefined) {
  if (!pane) return "";
  return `${pane.items
    .map((entry) =>
      entry.meta
        ? `${entry.label.padEnd(22)}${tint.dim(entry.meta)}`
        : entry.label,
    )
    .join("\n")}\n`;
}

/**
 * Every file in the shell's home directory.
 * @param posts each post's markdown, by slug
 * @param origin where the site is served, for links back to its pages
 */
export function siteFiles(
  data: SiteData,
  panes: readonly Pane[],
  posts: Readonly<Record<string, string>>,
  origin: string,
): Record<string, string> {
  const pane = (id: string) => panes.find((entry) => entry.id === id);
  const log = pane("log")?.items ?? [];

  const appBlock = (apps: typeof SHIPPED) =>
    apps
      .map(
        (app) =>
          `${tint.bold(app.name)}\n  ${app.description}\n  ${app.links
            .map((entry) => link(entry.href, entry.label))
            .join(tint.dim(" · "))}`,
      )
      .join("\n\n");

  const files: Record<string, string> = {
    "README.md": [
      `# ${INTRO}`,
      "",
      "This is the site as a home directory. Nothing you type leaves your",
      "browser.",
      "",
      "Run `menu` to see the scripts, or look around with ls, cd and cat.",
      "Posts are in blog/. `git log` prints the history.",
      "",
    ].join("\n"),
    "about.txt": `${tint.amber(INTRO)}\n\n${FOCUS_SENTENCE}\n\n${THINGS_SENTENCE}\n\nDubai, UAE\n`,
    "work.txt": `${WORK.map(
      (entry) =>
        `${tint.bold(entry.company)}  ${tint.dim(entry.period)}\n  ${entry.description}\n  ${link(entry.href, entry.href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))}`,
    ).join("\n\n")}\n`,
    "apps.txt": `${tint.amber("Shipped, and in the stores")}\n\n${appBlock(SHIPPED)}\n\n${tint.amber("Side projects")}\n\n${appBlock(SIDE)}\n`,
    "books.txt": `${LIBRARY.map((book) => `${book.title}  ${tint.dim(book.author)}`).join("\n")}\n`,
    "links.txt": `${data.links
      .map(
        (entry) =>
          `${link(entry.url, entry.website)}  ${tint.dim(entry.type.toLowerCase())}`,
      )
      .join("\n")}\n`,
    "contact.txt": `${CONTACT.map(
      (entry) =>
        `${entry.label.toLowerCase().padEnd(12)}${link(entry.href, entry.value)}`,
    ).join("\n")}\n${"cv".padEnd(12)}${link(`${origin}/cv.pdf`, "cv.pdf")}\n`,
    "cats.txt": `${CATS.map((cat) => `${tint.bold(cat.name.padEnd(8))}${cat.coat}`).join("\n")}\n\nThey live in the ${link(`${origin}${OFFICE}`, "office")}, a room you can stand in.\n`,
    "blog/INDEX": `${data.posts
      .map(
        (post) =>
          `${tint.dim(shortDate(post.date).padEnd(13))}${tint.bold(post.slug)}\n${" ".repeat(13)}${post.title}`,
      )
      .join(
        "\n",
      )}\n\n${tint.dim("Read one with:")} post ${data.posts[0]?.slug ?? "<name>"}\n`,
    ".site/log": graph(log),
    ".site/branch": listing(pane("branches")),
    ".site/tag": listing(pane("tags")),
    ".site/remote": `${CONTACT.map(
      (entry) =>
        `${entry.label.toLowerCase().padEnd(12)}${link(entry.href, entry.value)}`,
    ).join("\n")}\n`,
    ".site/stash": listing(pane("stash")),
    ".site/menu": `${SCRIPTS.map(
      (entry) => `${tint.green(entry.run.padEnd(10))}${entry.says}`,
    ).join(
      "\n",
    )}\n\n${tint.dim("Also: ls, cd, cat, grep, head, wc and the rest of a small bash.")}\n`,
    "bin/menu": script("cat ~/.site/menu"),
    "bin/about": script("cat ~/about.txt"),
    "bin/work": script("cat ~/work.txt"),
    "bin/apps": script("cat ~/apps.txt"),
    "bin/books": script("cat ~/books.txt"),
    "bin/links": script("cat ~/links.txt"),
    "bin/contact": script("cat ~/contact.txt"),
    "bin/cats": script("cat ~/cats.txt"),
    "bin/blog": script("cat ~/blog/INDEX"),
    "bin/post": script(
      [
        'if [ -z "$1" ]; then',
        '  echo "usage: post <name>    (run blog for the names)"',
        "  exit 1",
        "fi",
        // biome-ignore lint/suspicious/noTemplateCurlyInString: bash's own ${…}, in a script the shell runs.
        'file=~/blog/"${1%.md}".md',
        'if [ -f "$file" ]; then',
        '  cat "$file"',
        "else",
        '  echo "post: nothing called $1 (run blog for the names)"',
        "  exit 1",
        "fi",
      ].join("\n"),
    ),
    "bin/git": script(
      [
        'case "$1" in',
        "  log) cat ~/.site/log ;;",
        "  branch) cat ~/.site/branch ;;",
        "  tag) cat ~/.site/tag ;;",
        "  remote) cat ~/.site/remote ;;",
        "  stash) cat ~/.site/stash ;;",
        '  status) echo "On branch main"; echo "nothing to commit, working tree clean" ;;',
        '  "") echo "usage: git log | branch | tag | remote | stash | status" ;;',
        "  *) echo \"git: '$1' is not a git command here. Try: log, branch, tag, remote, stash, status\" ;;",
        "esac",
      ].join("\n"),
    ),
  };

  for (const [slug, text] of Object.entries(posts)) {
    files[`blog/${slug}.md`] = text.endsWith("\n") ? text : `${text}\n`;
  }

  return Object.fromEntries(
    Object.entries(files).map(([path, content]) => [
      `${HOME}/${path}`,
      content,
    ]),
  );
}
