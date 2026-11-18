"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { capture } from "@/lib/analytics";
import { toTerminal } from "./paths";
import { build, type Item, type Lane } from "./repo";
import { INTRO, leavesSite, linkProps, type SiteData } from "./site-data";
import s from "./terminal.module.css";

// The home page: the site as a repository, in a text-mode git client. The
// commit graph is the main pane (work on main, writing on a branch beside
// it); branches, tags, remotes and the stash are the small panes on the
// left; the right pane shows whatever is selected, the way `git show`
// would. Steered with the keyboard, a mouse or a finger. Enter opens the
// selected thing: a post, the links and the office each open in a tab.

// One row's piece of the graph. Rows are a fixed height and touch, so the
// lines join from row to row.
function Graph({
  lane,
  first,
  last,
  through,
  fork,
}: {
  lane: Lane;
  first: boolean;
  last: boolean;
  through: boolean;
  fork: boolean;
}) {
  return (
    <svg className={s.graph} viewBox="0 0 40 26" aria-hidden="true">
      {first ? null : <path className={s.main} d="M10 0V13" />}
      {last ? null : <path className={s.main} d="M10 13V26" />}
      {through ? <path className={s.writing} d="M28 0V26" /> : null}
      {first ? (
        <path className={s.writing} d="M10 13C10 23 28 16 28 26" />
      ) : null}
      {fork ? (
        <path className={s.writing} d="M28 0V13C28 23 10 16 10 26" />
      ) : null}
      <circle
        className={s[lane]}
        cx={lane === "main" ? 10 : 28}
        cy="13"
        r={first ? 5 : 3.6}
      />
    </svg>
  );
}

function trackProps(item: Item) {
  const track = item.track;
  if (!track) return {};
  return {
    "data-analytics-event": track.event,
    "data-analytics-company": track.company,
    "data-analytics-project": track.project,
    "data-analytics-slug": track.slug,
    "data-analytics-destination": track.destination,
    "data-analytics-location": "Home",
  };
}

export function GitClient({
  data,
  active,
}: {
  data: SiteData;
  /** Whether the git tab is the one in front, and so owns the keyboard. */
  active: boolean;
}) {
  const router = useRouter();
  const panes = build(data);
  const [focus, setFocus] = useState(0);
  const [cursors, setCursors] = useState<number[]>(() => panes.map(() => 0));
  const rootRef = useRef<HTMLElement>(null);

  const pane = panes[focus];
  const item = pane.items[cursors[focus]];
  const log = panes[0].items;
  const lastPost = log.findLastIndex((entry) => entry.lane === "writing");
  // Pointing at a branch shows its history; pointing at a tag shows where
  // it sits.
  const shown = pane.id === "branches" ? item.shows : undefined;
  const marked = pane.id === "tags" ? item.marks : undefined;

  // What enter does: follow the selected thing's first link. A page of this
  // site opens as a tab; anything else opens outside.
  const open = (target: Item) => {
    const href = target.links?.[0]?.href;
    if (!href) return;
    if (target.track) {
      const { event, ...properties } = target.track;
      capture(event, {
        ...properties,
        location: "Home",
      });
    }
    if (href.startsWith("http")) window.open(href, "_blank", "noopener");
    else if (leavesSite(href)) window.location.assign(href);
    else router.push(toTerminal(href));
  };

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        if (target.closest("input, textarea")) return;
        // A focused link or button keeps its own enter.
        if (event.key === "Enter" && target.closest("a[href], button")) return;
      }
      const key = event.key;
      const count = panes.length;
      const move = (step: number) =>
        setCursors((current) =>
          current.map((value, index) =>
            index === focus
              ? Math.min(Math.max(value + step, 0), pane.items.length - 1)
              : value,
          ),
        );
      if (/^[1-9]$/.test(key) && Number(key) <= count) {
        setFocus(Number(key) - 1);
      } else if (key === "ArrowDown" || key === "j") {
        move(1);
      } else if (key === "ArrowUp" || key === "k") {
        move(-1);
      } else if (key === "ArrowRight" || key === "l") {
        setFocus((focus + 1) % count);
      } else if (key === "ArrowLeft" || key === "h") {
        setFocus((focus + count - 1) % count);
      } else if (key === "Enter" || key === "o") {
        open(item);
      } else {
        return;
      }
      event.preventDefault();
      // The cursor has moved on from whatever was last clicked, so focus
      // leaves that line (or tab) for the client itself. Enter then opens
      // the selected line, not the one that was clicked before.
      if (key !== "Enter" && key !== "o")
        rootRef.current?.focus({
          preventScroll: true,
        });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Keep each pane's selected line, and a tag's commit, in view.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when the selection moves; the effect reads the DOM, not the values.
  useEffect(() => {
    const lists = rootRef.current?.querySelectorAll<HTMLElement>("[data-list]");
    for (const list of lists ?? []) {
      const target =
        list.querySelector<HTMLElement>("[data-marked]") ??
        list.querySelector<HTMLElement>("[data-selected]");
      if (!target) continue;
      const top = target.offsetTop - list.offsetTop;
      if (top < list.scrollTop) list.scrollTop = top;
      else if (top + target.offsetHeight > list.scrollTop + list.clientHeight)
        list.scrollTop = top + target.offsetHeight - list.clientHeight;
    }
  }, [
    focus,
    cursors,
  ]);

  const onPane = (event: MouseEvent<HTMLElement>) =>
    setFocus(Number(event.currentTarget.dataset.pane));

  // A press selects a line; a second press on the selected line opens it,
  // as enter does.
  const onRow = (event: MouseEvent<HTMLElement>) => {
    const paneIndex = Number(event.currentTarget.dataset.pane);
    const rowIndex = Number(event.currentTarget.dataset.row);
    if (paneIndex === focus && rowIndex === cursors[focus]) {
      open(item);
      return;
    }
    setFocus(paneIndex);
    setCursors((current) =>
      current.map((value, index) => (index === paneIndex ? rowIndex : value)),
    );
  };

  const title = (paneIndex: number) => (
    <h2 className={s.paneTitle}>
      <button type="button" data-pane={paneIndex} onClick={onPane}>
        [{paneIndex + 1}] {panes[paneIndex].title}
      </button>
      <span>
        {cursors[paneIndex] + 1} of {panes[paneIndex].items.length}
      </span>
    </h2>
  );

  return (
    <main
      className={s.main}
      ref={rootRef}
      tabIndex={-1}
      data-region
      data-hidden={!active || undefined}
      data-analytics-view="Content Viewed"
      data-analytics-label="Intro"
    >
      <h1 className={s.srOnly}>{INTRO}</h1>

      <section
        className={`${s.pane} ${s.log}`}
        data-focused={focus === 0 || undefined}
        data-shown={shown}
      >
        {title(0)}
        <div className={s.list} data-list>
          {log.map((entry, index) => (
            <button
              key={entry.id}
              type="button"
              className={s.commit}
              data-pane={0}
              data-row={index}
              data-lane={entry.lane}
              data-head={index === 0 || undefined}
              data-selected={index === cursors[0] || undefined}
              data-marked={marked === entry.id || undefined}
              onClick={onRow}
            >
              <Graph
                lane={entry.lane ?? "main"}
                first={index === 0}
                last={index === log.length - 1}
                through={index > 0 && index < lastPost}
                fork={index === lastPost}
              />
              <span className={s.text}>
                <span className={s.hash}>{entry.hash}</span>
                <span className={s.message}>
                  {entry.refs ? (
                    <span className={s.refs}>({entry.refs}) </span>
                  ) : null}
                  {entry.type ? (
                    <span className={s.type}>{entry.type}: </span>
                  ) : null}
                  {entry.label}
                  {entry.tags?.length ? (
                    <span className={s.tagged}>
                      {" "}
                      (tag: {entry.tags.join(", ")})
                    </span>
                  ) : null}
                </span>
                <span className={s.date}>{entry.meta}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <nav className={s.side} aria-label="Repository">
        {panes.slice(1).map((entry, offset) => {
          const paneIndex = offset + 1;
          return (
            <section
              key={entry.id}
              className={s.pane}
              data-focused={paneIndex === focus || undefined}
              style={
                {
                  "--lines": entry.items.length,
                } as CSSProperties
              }
            >
              {title(paneIndex)}
              <div className={s.list} data-list>
                {entry.items.map((row, rowIndex) => (
                  <button
                    key={row.id}
                    type="button"
                    className={s.line}
                    data-pane={paneIndex}
                    data-row={rowIndex}
                    data-selected={rowIndex === cursors[paneIndex] || undefined}
                    onClick={onRow}
                  >
                    <span>{row.label}</span>
                    {row.meta ? <span>{row.meta}</span> : null}
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </nav>

      <article className={`${s.pane} ${s.detail}`} aria-live="polite">
        <h2 className={s.paneTitle}>
          <span>[0] show</span>
        </h2>
        <div className={s.show} key={item.id}>
          <p className={s.kicker}>
            {item.kicker} <b>{item.hash ?? item.label.trim()}</b>
            {item.refs ? <span className={s.refs}> ({item.refs})</span> : null}
            {item.tags?.length ? (
              <span className={s.tagged}> (tag: {item.tags.join(", ")})</span>
            ) : null}
          </p>
          {item.fields ? (
            <dl className={s.fields}>
              {item.fields.map(([key, value]) => (
                <div key={key}>
                  <dt>{key}:</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <h3 className={s.big} data-head={item.id === "head" || undefined}>
            {item.title}
          </h3>
          {item.lines ? (
            <div className={s.diff}>
              {item.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}
          {item.trailers ? (
            <p className={s.trailers}>
              {item.trailers.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
          ) : null}
          {item.links ? (
            <ul className={s.links}>
              {item.links.map((link, index) => {
                const body = (
                  <>
                    <kbd>{index === 0 ? "enter" : "·"}</kbd>
                    {link.label}
                  </>
                );
                return (
                  <li key={`${link.label}-${link.href}`}>
                    {leavesSite(link.href) ? (
                      <a
                        href={link.href}
                        {...linkProps(link.href)}
                        {...trackProps(item)}
                      >
                        {body}
                      </a>
                    ) : (
                      <Link href={toTerminal(link.href)} {...trackProps(item)}>
                        {body}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </article>

      <p className={s.touchHint}>
        tap a pane, then a line; tap it again to open
      </p>
    </main>
  );
}
