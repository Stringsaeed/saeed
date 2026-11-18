"use client";

import {
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useRef,
  useState,
} from "react";
import { LocalClock } from "@/components/local-clock";
import {
  CATS,
  CONTACT,
  FOCUS_SENTENCE,
  INTRO,
  LIBRARY,
  linkProps,
  SHIPPED,
  SIDE,
  type SiteData,
  shortDate,
  THINGS_SENTENCE,
  WORK,
} from "../data";
import { Logo } from "../logo";
import s from "./desktop.module.css";

// Direction 2: the site is a desktop, but an operating system of his own
// rather than a copy of anyone's. Each part of the site is a window you can
// drag, stack and close. Bosha sits on whichever window is in front and
// Sono walks the bottom of the screen. On a phone the windows tile in one
// column and the menu bar jumps between them.

type WinId =
  | "about"
  | "work"
  | "apps"
  | "blog"
  | "library"
  | "links"
  | "contact";

type WinDef = {
  id: WinId;
  title: string;
  menu: string;
  glyph: "doc" | "folder" | "disk" | "card";
  tint: string;
  left: string;
  top: string;
  width: number;
  open: boolean;
};

const WINDOWS: readonly WinDef[] = [
  {
    id: "about",
    title: "readme.txt",
    menu: "About",
    glyph: "doc",
    tint: "#ffd166",
    left: "13%",
    top: "9%",
    width: 440,
    open: true,
  },
  {
    id: "work",
    title: "work.log",
    menu: "Work",
    glyph: "doc",
    tint: "#9ad1ff",
    left: "9%",
    top: "51%",
    width: 400,
    open: true,
  },
  {
    id: "apps",
    title: "apps/",
    menu: "Apps",
    glyph: "folder",
    tint: "#ffa8c5",
    left: "62%",
    top: "6%",
    width: 520,
    open: true,
  },
  {
    id: "blog",
    title: "blog/",
    menu: "Blog",
    glyph: "folder",
    tint: "#b8e0a5",
    left: "36%",
    top: "55%",
    width: 460,
    open: true,
  },
  {
    id: "library",
    title: "library/",
    menu: "Library",
    glyph: "folder",
    tint: "#d7b9ff",
    left: "30%",
    top: "22%",
    width: 500,
    open: false,
  },
  {
    id: "links",
    title: "links.db",
    menu: "Links",
    glyph: "disk",
    tint: "#ffc09a",
    left: "44%",
    top: "18%",
    width: 420,
    open: false,
  },
  {
    id: "contact",
    title: "contact.card",
    menu: "Contact",
    glyph: "card",
    tint: "#a5e6dd",
    left: "66%",
    top: "52%",
    width: 340,
    open: false,
  },
];

const GLYPH: Record<WinDef["glyph"], string> = {
  doc: "M7 3h10l5 5v17H7zM17 3v5h5M10 13h8M10 17h8M10 21h5",
  folder: "M3 8h8l2 3h12v13H3z",
  disk: "M4 4h17l3 3v17H4zM9 4v7h9V4M8 24v-8h12v8",
  card: "M3 6h22v16H3zM7 17c0-5 7-5 7 0M10.5 11.5h.1M17 11h5M17 15h5",
};

function Glyph({ name }: { name: WinDef["glyph"] }) {
  return (
    <svg className={s.glyph} viewBox="0 0 28 28" aria-hidden="true">
      <path d={GLYPH[name]} />
    </svg>
  );
}

// A sitting cat, facing you, a pixel to a square. # coat, w white, o eye,
// p nose. Placeholder sprites: the real ones would be drawn properly.
const CAT_ROWS = [
  "..#.....#...",
  "..##...##...",
  "..#######...",
  "..#o###o#...",
  "..###p###...",
  "...#www#....",
  "..##www##.#.",
  "..##www##.#.",
  "..#######.#.",
  "..#w###w###.",
];

const COATS = {
  tuxedo: {
    "#": "#1d1b19",
    w: "#ffffff",
    o: "#b6e36a",
    p: "#ff9aa8",
  },
  orange: {
    "#": "#e8913a",
    w: "#fff6e8",
    o: "#3a2a1a",
    p: "#ff9aa8",
  },
} as const;

function Cat({ coat }: { coat: keyof typeof COATS }) {
  const palette = COATS[coat];
  return (
    <svg
      className={s.sprite}
      viewBox="0 0 12 10"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {CAT_ROWS.flatMap((row, y) =>
        Array.from(row, (cell, x) =>
          cell === "." ? null : (
            <rect
              // biome-ignore lint/suspicious/noArrayIndexKey: a fixed pixel grid; the position is the identity.
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="1"
              height="1"
              fill={palette[cell as keyof typeof palette]}
            />
          ),
        ),
      )}
    </svg>
  );
}

type Offset = {
  dx: number;
  dy: number;
};

export function Desktop({ data }: { data: SiteData }) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      WINDOWS.map((win) => [
        win.id,
        win.open,
      ]),
    ),
  );
  const [offsets, setOffsets] = useState<Record<string, Offset>>({});
  // Back to front. The readme starts on top.
  const [order, setOrder] = useState<WinId[]>([
    "contact",
    "work",
    "apps",
    "blog",
    "library",
    "links",
    "about",
  ]);
  const [app, setApp] = useState(SHIPPED[0].id);
  const drag = useRef<{
    id: WinId;
    x: number;
    y: number;
    base: Offset;
  } | null>(null);

  const front = [
    ...order,
  ]
    .reverse()
    .find((id) => open[id]);
  const selected = [
    ...SHIPPED,
    ...SIDE,
  ].find((entry) => entry.id === app);

  const raise = (id: WinId) =>
    setOrder((current) => [
      ...current.filter((other) => other !== id),
      id,
    ]);

  const onOpen = (event: MouseEvent<HTMLElement>) => {
    const id = event.currentTarget.dataset.win as WinId;
    setOpen((current) => ({
      ...current,
      [id]: true,
    }));
    raise(id);
    // On a phone the windows are a column, so opening one means going to it.
    if (window.matchMedia("(max-width: 799px)").matches) {
      document.getElementById(`win-${id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const onClose = (event: MouseEvent<HTMLElement>) => {
    const id = event.currentTarget.dataset.win as WinId;
    setOpen((current) => ({
      ...current,
      [id]: false,
    }));
  };

  const onRaise = (event: PointerEvent<HTMLElement>) =>
    raise(event.currentTarget.dataset.win as WinId);

  const onDragStart = (event: PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    if (window.matchMedia("(max-width: 799px)").matches) return;
    const id = event.currentTarget.dataset.win as WinId;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id,
      x: event.clientX,
      y: event.clientY,
      base: offsets[id] ?? {
        dx: 0,
        dy: 0,
      },
    };
  };

  const onDragMove = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (!current) return;
    setOffsets((all) => ({
      ...all,
      [current.id]: {
        dx: current.base.dx + event.clientX - current.x,
        dy: current.base.dy + event.clientY - current.y,
      },
    }));
  };

  const onDragEnd = () => {
    drag.current = null;
  };

  const onPickApp = (event: MouseEvent<HTMLElement>) =>
    setApp(event.currentTarget.dataset.app ?? app);

  const appGrid = (title: string, apps: typeof SHIPPED) => (
    <>
      <h3 className={s.group}>{title}</h3>
      <div className={s.icons}>
        {apps.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={s.appIcon}
            data-app={entry.id}
            data-active={entry.id === app || undefined}
            onClick={onPickApp}
          >
            <Logo src={entry.logo} size={40} />
            <span>{entry.name}</span>
          </button>
        ))}
      </div>
    </>
  );

  const BODY: Record<WinId, ReactNode> = {
    about: (
      <>
        <h1 className={s.hello}>{INTRO}</h1>
        <p>{FOCUS_SENTENCE}</p>
        <p className={s.soft}>{THINGS_SENTENCE}</p>
      </>
    ),
    work: (
      <ul className={s.rows}>
        {WORK.map((entry) => (
          <li key={entry.company}>
            <Logo src={entry.logo} size={20} />
            <div>
              <p>
                <a href={entry.href} {...linkProps(entry.href)}>
                  {entry.company}
                </a>
                <span className={s.mono}>{entry.period}</span>
              </p>
              <p className={s.soft}>{entry.description}</p>
            </div>
          </li>
        ))}
      </ul>
    ),
    apps: (
      <>
        {appGrid("Shipped", SHIPPED)}
        {appGrid("Side projects", SIDE)}
        {selected ? (
          <p className={s.status}>
            <strong>{selected.name}.</strong> {selected.description}{" "}
            {selected.links.map((link) => (
              <a key={link.href} href={link.href} {...linkProps(link.href)}>
                {link.label} ↗
              </a>
            ))}
          </p>
        ) : null}
      </>
    ),
    blog: (
      <>
        <ul className={s.files}>
          {data.posts.slice(0, 6).map((post) => (
            <li key={post.slug}>
              <a href={`/blog/${post.slug}`}>{post.title}</a>
              <span className={s.mono}>{shortDate(post.date)}</span>
            </li>
          ))}
        </ul>
        <p className={s.status}>
          {data.posts.length} posts. <a href="/blog">Open the folder ↗</a>
        </p>
      </>
    ),
    library: (
      <div className={s.covers}>
        {LIBRARY.map((book) => (
          <figure key={book.id}>
            {/* biome-ignore lint/performance/noImgElement: prototype cover thumbnails. */}
            <img src={book.cover} alt="" loading="lazy" />
            <figcaption>
              {book.title}
              <span className={s.soft}>{book.author}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    ),
    links: (
      <>
        <ul className={s.files}>
          {data.linkSample.map((entry) => (
            <li key={entry.url}>
              <a href={entry.url} {...linkProps(entry.url)}>
                {entry.website}
              </a>
              <span className={s.mono}>{entry.type}</span>
            </li>
          ))}
        </ul>
        <p className={s.status}>
          {data.linkCount} records. <a href="/links">Open the archive ↗</a>
        </p>
      </>
    ),
    contact: (
      <ul className={s.files}>
        {CONTACT.map((entry) => (
          <li key={entry.label}>
            <a href={entry.href} {...linkProps(entry.href)}>
              {entry.label}
            </a>
            <span className={s.mono}>{entry.value}</span>
          </li>
        ))}
        <li>
          <a href="/cv.pdf">CV</a>
          <span className={s.mono}>cv.pdf</span>
        </li>
      </ul>
    ),
  };

  return (
    <div className={s.root}>
      <header className={s.menubar}>
        <strong className={s.brand}>◆ saeedOS</strong>
        <nav className={s.menu} aria-label="Windows">
          {WINDOWS.map((win) => (
            <button
              key={win.id}
              type="button"
              data-win={win.id}
              data-active={front === win.id || undefined}
              onClick={onOpen}
            >
              {win.menu}
            </button>
          ))}
        </nav>
        <span className={s.clock}>
          Dubai <LocalClock />
        </span>
      </header>

      <div className={s.desk}>
        <nav className={s.shortcuts} aria-label="Desktop">
          {WINDOWS.map((win) => (
            <button
              key={win.id}
              type="button"
              data-win={win.id}
              onClick={onOpen}
            >
              <Glyph name={win.glyph} />
              <span>{win.title}</span>
            </button>
          ))}
          <a href="/office">
            <Cat coat="tuxedo" />
            <span>office.app</span>
          </a>
        </nav>

        {WINDOWS.map((win) => {
          const offset = offsets[win.id];
          return (
            <section
              key={win.id}
              id={`win-${win.id}`}
              className={s.win}
              data-win={win.id}
              data-front={front === win.id || undefined}
              data-closed={!open[win.id] || undefined}
              aria-label={win.title}
              style={
                {
                  "--l": win.left,
                  "--t": win.top,
                  "--w": `${win.width}px`,
                  "--dx": `${offset?.dx ?? 0}px`,
                  "--dy": `${offset?.dy ?? 0}px`,
                  "--tint": win.tint,
                  zIndex: order.indexOf(win.id) + 1,
                } as CSSProperties
              }
              onPointerDown={onRaise}
            >
              {front === win.id ? (
                <a
                  className={s.bosha}
                  href="/office"
                  title={`${CATS[0].name}, who sits on whatever you are reading`}
                >
                  <Cat coat="tuxedo" />
                  <span>{CATS[0].name}</span>
                </a>
              ) : null}
              <div
                className={s.bar}
                data-win={win.id}
                onPointerDown={onDragStart}
                onPointerMove={onDragMove}
                onPointerUp={onDragEnd}
                onPointerCancel={onDragEnd}
              >
                <button
                  type="button"
                  className={s.close}
                  data-win={win.id}
                  aria-label={`Close ${win.title}`}
                  onClick={onClose}
                >
                  ×
                </button>
                <h2 className={s.title}>{win.title}</h2>
              </div>
              <div className={s.body}>{BODY[win.id]}</div>
            </section>
          );
        })}

        <a
          className={s.sono}
          href="/office"
          title={`${CATS[1].name}, on patrol`}
        >
          <Cat coat="orange" />
          <span>{CATS[1].name}</span>
        </a>
      </div>
    </div>
  );
}
