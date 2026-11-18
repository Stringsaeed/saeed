"use client";

import { type MouseEvent, useEffect, useRef, useState } from "react";
import { LocalClock } from "@/components/local-clock";
import {
  APPS,
  CATS,
  CONTACT,
  FOCUS_SENTENCE,
  INTRO,
  LIBRARY,
  linkProps,
  type SiteData,
  shortDate,
  THINGS,
  WORK,
} from "../data";
import s from "./tui.module.css";

// Direction 3: a terminal, but not one you type into. It is a text-mode
// interface in the manner of the tools a developer leaves open all day:
// stacked panes on the left, the selected thing on the right, steered with
// the arrow keys (or a mouse, or a finger). The focused pane grows and the
// others fold to three lines.

type Row = {
  id: string;
  label: string;
  meta?: string;
  title: string;
  fields?: readonly (readonly [
    string,
    string,
  ])[];
  text?: string;
  links?: readonly {
    label: string;
    href: string;
  }[];
};

type Pane = {
  id: string;
  title: string;
  rows: Row[];
};

function host(href: string) {
  return href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

function panes(data: SiteData): Pane[] {
  return [
    {
      id: "about",
      title: "about",
      rows: [
        {
          id: "whoami",
          label: "whoami",
          title: INTRO,
          text: FOCUS_SENTENCE,
          fields: [
            [
              "where",
              "Dubai, UAE",
            ],
            [
              "shipped",
              `${APPS.filter((app) => app.kind === "shipped").length} apps in the stores`,
            ],
            [
              "writing",
              `${data.posts.length} posts`,
            ],
          ],
        },
        {
          id: "things",
          label: "things",
          title: "Things",
          fields: THINGS.map(
            (thing) =>
              [
                thing.lead,
                thing.rest,
              ] as const,
          ),
        },
        {
          id: "cats",
          label: "cats",
          meta: "2 running",
          title: "Cats",
          fields: CATS.map(
            (cat) =>
              [
                cat.name,
                cat.coat,
              ] as const,
          ),
          text: "They live in the office, a room you can stand in.",
          links: [
            {
              label: "Step into the office",
              href: "/office",
            },
          ],
        },
      ],
    },
    {
      id: "work",
      title: "work",
      rows: WORK.map((entry) => ({
        id: entry.company,
        label: entry.company,
        meta: entry.period,
        title: entry.company,
        fields: [
          [
            "when",
            entry.period,
          ],
          [
            "site",
            host(entry.href),
          ],
        ],
        text: entry.description,
        links: [
          {
            label: `Visit ${entry.company}`,
            href: entry.href,
          },
        ],
      })),
    },
    {
      id: "apps",
      title: "apps",
      rows: APPS.map((app) => ({
        id: app.id,
        label: app.name,
        meta: app.kind === "shipped" ? "shipped" : "side",
        title: app.name,
        fields: [
          [
            "kind",
            app.kind === "shipped" ? "shipped app" : "side project",
          ],
        ],
        text: app.description,
        links: app.links,
      })),
    },
    {
      id: "blog",
      title: "blog",
      rows: data.posts.map((post) => ({
        id: post.slug,
        label: post.title,
        meta: shortDate(post.date),
        title: post.title,
        fields: [
          [
            "date",
            shortDate(post.date),
          ],
          [
            "tags",
            post.tags.join(", "),
          ],
        ],
        text: post.description,
        links: [
          {
            label: "Read the post",
            href: `/blog/${post.slug}`,
          },
        ],
      })),
    },
    {
      id: "library",
      title: "library",
      rows: LIBRARY.map((book) => ({
        id: book.id,
        label: book.title,
        meta: book.author,
        title: book.title,
        fields: [
          [
            "author",
            book.author,
          ],
        ],
        text: "On the shelf.",
      })),
    },
    {
      id: "etc",
      title: "links + contact",
      rows: [
        {
          id: "links",
          label: "links archive",
          meta: `${data.linkCount}`,
          title: "Links",
          text: `${data.linkCount} saved websites, tools, articles, and references.`,
          links: [
            {
              label: "Open the archive",
              href: "/links",
            },
          ],
        },
        ...CONTACT.map((entry) => ({
          id: entry.label,
          label: entry.label.toLowerCase(),
          meta: entry.value,
          title: entry.label,
          text: entry.value,
          links: [
            {
              label: `Open ${entry.label}`,
              href: entry.href,
            },
          ],
        })),
        {
          id: "cv",
          label: "cv",
          meta: "cv.pdf",
          title: "CV",
          text: "The résumé, as a PDF.",
          links: [
            {
              label: "Download",
              href: "/cv.pdf",
            },
          ],
        },
      ],
    },
  ];
}

export function Tui({ data }: { data: SiteData }) {
  const all = panes(data);
  const [focus, setFocus] = useState(0);
  const [cursors, setCursors] = useState<number[]>(() => all.map(() => 0));
  const rootRef = useRef<HTMLDivElement>(null);

  const pane = all[focus];
  const row = pane.rows[cursors[focus]];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const count = all.length;
      const move = (step: number) =>
        setCursors((current) =>
          current.map((value, index) =>
            index === focus
              ? Math.min(Math.max(value + step, 0), pane.rows.length - 1)
              : value,
          ),
        );
      if (/^[1-9]$/.test(event.key) && Number(event.key) <= count) {
        setFocus(Number(event.key) - 1);
      } else if (event.key === "ArrowDown" || event.key === "j") {
        move(1);
      } else if (event.key === "ArrowUp" || event.key === "k") {
        move(-1);
      } else if (event.key === "ArrowRight" || event.key === "l") {
        setFocus((focus + 1) % count);
      } else if (event.key === "ArrowLeft" || event.key === "h") {
        setFocus((focus + count - 1) % count);
      } else if (event.key === "Enter" || event.key === "o") {
        const href = row.links?.[0]?.href;
        if (!href) return;
        if (href.startsWith("http")) window.open(href, "_blank", "noopener");
        else window.location.assign(href);
      } else {
        return;
      }
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Keep each pane's selected line in view as the panes fold and grow.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when the selection moves; the effect reads the DOM, not the values.
  useEffect(() => {
    const lists = rootRef.current?.querySelectorAll<HTMLElement>("[data-list]");
    for (const list of lists ?? []) {
      const selected = list.querySelector<HTMLElement>("[data-selected]");
      if (!selected) continue;
      const top = selected.offsetTop - list.offsetTop;
      if (top < list.scrollTop) list.scrollTop = top;
      else if (top + selected.offsetHeight > list.scrollTop + list.clientHeight)
        list.scrollTop = top + selected.offsetHeight - list.clientHeight;
    }
  }, [
    focus,
    cursors,
  ]);

  const onPane = (event: MouseEvent<HTMLElement>) =>
    setFocus(Number(event.currentTarget.dataset.pane));

  const onRow = (event: MouseEvent<HTMLElement>) => {
    const paneIndex = Number(event.currentTarget.dataset.pane);
    const rowIndex = Number(event.currentTarget.dataset.row);
    setFocus(paneIndex);
    setCursors((current) =>
      current.map((value, index) => (index === paneIndex ? rowIndex : value)),
    );
  };

  return (
    <div className={s.root} ref={rootRef}>
      <header className={s.top}>
        <span>
          <b>saeed</b>@dubai <i>~/site</i>
        </span>
        <span className={s.topRight}>
          <LocalClock />
        </span>
      </header>

      <div className={s.main}>
        <nav className={s.side} aria-label="Sections">
          {all.map((entry, paneIndex) => (
            <section
              key={entry.id}
              className={s.pane}
              data-focused={paneIndex === focus || undefined}
            >
              <h2 className={s.paneTitle}>
                <button type="button" data-pane={paneIndex} onClick={onPane}>
                  [{paneIndex + 1}] {entry.title}
                </button>
                <span>
                  {cursors[paneIndex] + 1} of {entry.rows.length}
                </span>
              </h2>
              <div className={s.list} data-list>
                {entry.rows.map((item, rowIndex) => (
                  <button
                    key={item.id}
                    type="button"
                    className={s.line}
                    data-pane={paneIndex}
                    data-row={rowIndex}
                    data-selected={rowIndex === cursors[paneIndex] || undefined}
                    onClick={onRow}
                  >
                    <span>{item.label}</span>
                    {item.meta ? <span>{item.meta}</span> : null}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </nav>

        <article className={`${s.pane} ${s.detail}`} aria-live="polite">
          <h2 className={s.paneTitle}>
            <span>
              [0] {pane.id}/{row.label}
            </span>
          </h2>
          <div className={s.detailBody} key={`${pane.id}/${row.id}`}>
            {pane.id === "about" && row.id === "whoami" ? (
              <h1 className={s.big}>{row.title}</h1>
            ) : (
              <h3 className={s.big}>{row.title}</h3>
            )}
            {row.text ? <p className={s.text}>{row.text}</p> : null}
            {row.fields ? (
              <dl className={s.fields}>
                {row.fields.map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {row.links ? (
              <ul className={s.links}>
                {row.links.map((link, index) => (
                  <li key={link.href}>
                    <a href={link.href} {...linkProps(link.href)}>
                      <kbd>{index === 0 ? "enter" : "·"}</kbd>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </article>
      </div>

      <footer className={s.keys}>
        <span>
          <kbd>↑↓</kbd> move
        </span>
        <span>
          <kbd>←→</kbd> pane
        </span>
        <span>
          <kbd>1–{all.length}</kbd> jump
        </span>
        <span>
          <kbd>enter</kbd> open
        </span>
        <span className={s.touchHint}>or tap a pane, then a line</span>
      </footer>
    </div>
  );
}
