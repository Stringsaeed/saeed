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

// The site as a repository: the log (work on main, writing on a branch
// beside it), and the branches, tags, remotes and stash around it. Plain
// data, read by both the git client's panes and the shell's `git` script.

export type Lane = "main" | "writing";

export type Track = {
  event: string;
  company?: string;
  project?: string;
  slug?: string;
  destination?: string;
};

export type Item = {
  id: string;
  label: string;
  meta?: string;
  kicker: string;
  title: string;
  lines?: readonly string[];
  fields?: readonly (readonly [
    string,
    string,
  ])[];
  links?: readonly {
    label: string;
    href: string;
  }[];
  trailers?: readonly string[];
  /** Log rows: which lane the commit sits on, and how git would label it. */
  lane?: Lane;
  type?: string;
  refs?: string;
  tags?: readonly string[];
  hash?: string;
  /** A branch whose history the log should show while it is pointed at. */
  shows?: Lane;
  /** A tag: the commit it sits on. */
  marks?: string;
  /** What analytics records when one of its links is followed. */
  track?: Track;
};

export type Pane = {
  id: string;
  title: string;
  items: Item[];
};

const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

// "Apr 2026 to Sep 2026" or "2025 to 2026": when the job began.
function periodStart(period: string) {
  const match = period.match(/(?:([A-Za-z]{3})\s+)?(\d{4})/);
  if (!match) return 0;
  const month = match[1] ? MONTHS.indexOf(match[1].toLowerCase()) : 0;
  return Date.UTC(Number(match[2]), Math.max(month, 0), 1);
}

// A short hash that is the same on every render. Decoration, not identity.
function hash(text: string) {
  let value = 2166136261;
  for (const char of text) {
    value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  }
  return (value >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

export function build(data: SiteData): Pane[] {
  const tagCommit = new Map<string, string>();

  const work = WORK.map((entry) => {
    const id = `work-${entry.company}`;
    const apps = SHIPPED.filter((app) =>
      app.name.toLowerCase().includes(entry.company.toLowerCase()),
    );
    for (const app of apps) tagCommit.set(app.id, id);
    const item: Item = {
      id,
      label: entry.company,
      meta: entry.period,
      track: {
        event: "Work Link Clicked",
        company: entry.company,
      },
      kicker: "commit",
      title: entry.company,
      lane: "main",
      type: "feat",
      hash: hash(id),
      tags: apps.map((app) => app.id),
      fields: [
        [
          "Date",
          entry.period,
        ],
      ],
      lines: [
        entry.description,
        ...apps.map((app) => `${app.name}: ${app.description}`),
      ],
      links: [
        {
          label: `Visit ${entry.company}`,
          href: entry.href,
        },
        ...apps.flatMap((app) =>
          app.links.map((link) => ({
            label: `${app.name} · ${link.label}`,
            href: link.href,
          })),
        ),
      ],
    };
    return {
      when: periodStart(entry.period),
      item,
    };
  });

  const posts = data.posts.map((post) => {
    const id = `post-${post.slug}`;
    const item: Item = {
      id,
      label: post.title,
      meta: shortDate(post.date),
      track: {
        event: "Blog Post Clicked",
        slug: post.slug,
      },
      kicker: "commit",
      title: post.title,
      lane: "writing",
      type: "docs",
      hash: hash(id),
      fields: [
        [
          "Date",
          shortDate(post.date),
        ],
        [
          "Tags",
          post.tags.join(", "),
        ],
      ],
      lines: [
        post.description,
      ],
      links: [
        {
          label: "Open in a tab",
          href: `/blog/${post.slug}`,
        },
      ],
    };
    return {
      when: Date.parse(post.date),
      item,
    };
  });

  const untagged = SHIPPED.filter((app) => !tagCommit.has(app.id));
  for (const app of untagged) tagCommit.set(app.id, "root");

  const log: Item[] = [
    {
      id: "head",
      label: INTRO,
      meta: "now",
      kicker: "commit",
      title: INTRO,
      lane: "main",
      refs: "HEAD → main",
      hash: hash("head"),
      fields: [
        [
          "Author",
          "Saeed",
        ],
        [
          "Where",
          "Dubai, UAE",
        ],
      ],
      lines: [
        FOCUS_SENTENCE,
        THINGS_SENTENCE,
      ],
      trailers: CATS.map(
        (cat) => `Co-authored-by: ${cat.name} (${cat.coat} cat)`,
      ),
      links: [
        {
          label: "Step into the office, where the cats live",
          href: "/office",
        },
      ],
    },
    ...[
      ...work,
      ...posts,
    ]
      .sort((a, b) => b.when - a.when)
      .map((entry) => entry.item),
    {
      // Undated in the site's data, so it says no more than that.
      id: "root",
      label: "More apps in the stores",
      meta: "undated",
      kicker: "commit",
      title: "More apps in the stores",
      lane: "main",
      type: "also",
      hash: hash("root"),
      tags: untagged.map((app) => app.id),
      lines: untagged.map((app) => `${app.name}: ${app.description}`),
      links: untagged.flatMap((app) =>
        app.links.map((link) => ({
          label: `${app.name} · ${link.label}`,
          href: link.href,
        })),
      ),
    },
  ];

  return [
    {
      id: "log",
      title: "log",
      items: log,
    },
    {
      id: "branches",
      title: "branches",
      items: [
        {
          id: "main",
          label: "* main",
          meta: `${WORK.length} companies`,
          kicker: "branch",
          title: "main",
          shows: "main",
          lines: [
            "Where I have worked, newest first. Shipped apps are tagged on the commits that made them.",
          ],
        },
        {
          id: "writing",
          label: "  writing",
          meta: `${data.posts.length} posts`,
          kicker: "branch",
          title: "writing",
          shows: "writing",
          lines: [
            "Everything I have written. Press enter on a post in the log to open it in a tab.",
          ],
          links: [
            {
              label: "List every post",
              href: "/blog",
            },
          ],
        },
        ...SIDE.map((app) => ({
          id: `side-${app.id}`,
          label: `  side/${app.id}`,
          track: {
            event: "Project Link Clicked",
            project: app.name,
          },
          kicker: "branch",
          title: app.name,
          lines: [
            app.description,
          ],
          links: app.links,
        })),
      ],
    },
    {
      id: "tags",
      title: "tags",
      items: SHIPPED.map((app) => ({
        id: `tag-${app.id}`,
        label: app.id,
        meta: "shipped",
        track: {
          event: "Project Link Clicked",
          project: app.name,
        },
        kicker: "tag",
        title: app.name,
        marks: tagCommit.get(app.id),
        lines: [
          app.description,
        ],
        links: app.links,
      })),
    },
    {
      id: "remotes",
      title: "remotes",
      items: CONTACT.map((entry) => ({
        id: `remote-${entry.label}`,
        label: entry.label.toLowerCase(),
        meta: entry.value,
        kicker: "remote",
        title: entry.label,
        fields: [
          [
            "url",
            entry.value,
          ],
        ] as const,
        links: [
          {
            label: `Open ${entry.label}`,
            href: entry.href,
          },
        ],
      })),
    },
    {
      id: "stash",
      title: "stash",
      items: [
        {
          id: "links",
          label: "links",
          meta: `${data.links.length} saved`,
          track: {
            event: "Navigation Clicked",
            destination: "Links",
          },
          kicker: "stash",
          title: "Links",
          lines: [
            `${data.links.length} saved websites, tools, articles, and references.`,
          ],
          links: [
            {
              label: "Open in a tab",
              href: "/links",
            },
          ],
        },
        {
          id: "office",
          label: "office",
          meta: "a room",
          track: {
            event: "Navigation Clicked",
            destination: "Office",
          },
          kicker: "stash",
          title: "Office",
          lines: [
            `A room you can stand in. ${CATS[0].name} and ${CATS[1].name} walk about and rest there.`,
          ],
          links: [
            {
              label: "Step into the office",
              href: "/office",
            },
          ],
        },
        {
          id: "cv",
          label: "cv.pdf",
          meta: "résumé",
          kicker: "stash",
          title: "CV",
          lines: [
            "The résumé, as a PDF.",
          ],
          links: [
            {
              label: "Download",
              href: "/cv.pdf",
            },
          ],
        },
        ...LIBRARY.map((book) => ({
          id: `book-${book.id}`,
          label: book.title,
          meta: book.author,
          kicker: "stash · book",
          title: book.title,
          fields: [
            [
              "Author",
              book.author,
            ],
          ] as const,
          lines: [
            "On the shelf.",
          ],
        })),
      ],
    },
  ];
}
