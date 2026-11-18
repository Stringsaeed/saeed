"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { LocalClock } from "@/components/local-clock";
import { GitClient } from "./git-client";
import { GIT, OFFICE, SHELL, toSite } from "./paths";
import type { SiteData } from "./site-data";
import s from "./terminal.module.css";

// The terminal version of the site is one window, and its tabs are the
// site's pages under /terminal: the git client is its home, /terminal/shell
// is a real shell, and every other page (a post, the blog, the links, the
// office) opens as a tab of its own, with
// its content rendered by that page on the server. The frame lives in the
// layout, so it stays put while the pages change under it: the tabs you
// have opened, the git client's cursor and the shell's session all survive
// a move from one to another.

// The terminal and its bash are large, so they load when the shell tab is
// first opened, not with the page.
const Shell = dynamic(() => import("./shell"), {
  ssr: false,
  loading: () => <p className={s.dim}>starting the shell…</p>,
});

function isPage(path: string) {
  return path !== GIT && path !== SHELL;
}

function tabLabel(path: string) {
  if (path === GIT) return "git";
  const page = toSite(path);
  if (path === SHELL) return "shell";
  if (page === "/blog") return "blog/";
  if (page.startsWith("/blog/")) return `${page.slice("/blog/".length)}.md`;
  return page.slice(1);
}

export function Frame({
  data,
  children,
}: {
  data: SiteData;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  // Pages opened so far, in order. The one in front always has a tab, even
  // before the effect below has recorded it.
  const [opened, setOpened] = useState<string[]>([]);
  // The git client and the shell mount on their first visit and then stay,
  // so a post's own HTML does not carry the home page inside it.
  const [seenGit, setSeenGit] = useState(pathname === GIT);
  const [seenShell, setSeenShell] = useState(pathname === SHELL);
  const pageRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const arrived = useRef(pathname);

  const pages =
    isPage(pathname) && !opened.includes(pathname)
      ? [
          ...opened,
          pathname,
        ]
      : opened;
  const tabs = [
    GIT,
    SHELL,
    ...pages,
  ];

  useEffect(() => {
    if (pathname === GIT) setSeenGit(true);
    else if (pathname === SHELL) setSeenShell(true);
    else
      setOpened((current) =>
        current.includes(pathname)
          ? current
          : [
              ...current,
              pathname,
            ],
      );
    // A new page starts at its top, unless the address points into it. On
    // a wide window the pane scrolls; on a phone the whole frame does.
    if (!window.location.hash) {
      pageRef.current?.scrollTo(0, 0);
      rootRef.current?.scrollTo(0, 0);
    }
    // After a move between tabs, focus goes to the tab's content, as it
    // would on a fresh page: the keys then act on what is in front, not on
    // the tab that was pressed. The shell takes focus itself.
    if (arrived.current !== pathname) {
      arrived.current = pathname;
      bodyRef.current
        ?.querySelector<HTMLElement>("[data-region]:not([data-hidden])")
        ?.focus({
          preventScroll: true,
        });
    }
  }, [
    pathname,
  ]);

  const close = (path: string) => {
    setOpened((current) => current.filter((entry) => entry !== path));
    if (path === pathname) router.push(GIT);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      // The shell and the office own the keyboard while they are in front.
      if (pathname === SHELL || pathname === OFFICE) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, figure[data-interactive]")
      )
        return;
      const key = event.key;
      if (key === "t") {
        router.push(tabs[(tabs.indexOf(pathname) + 1) % tabs.length]);
        event.preventDefault();
        return;
      }
      if (!isPage(pathname)) return;
      // A focused link or button keeps its own enter and space.
      if (
        (key === "Enter" || key === " ") &&
        target instanceof HTMLElement &&
        target.closest("a[href], button")
      )
        return;
      // On a phone the page scrolls with the window, and has no keys.
      const view = pageRef.current;
      const page = (view?.clientHeight ?? 400) - 60;
      if (key === "Escape" || key === "q") close(pathname);
      else if (key === "ArrowDown" || key === "j") view?.scrollBy(0, 66);
      else if (key === "ArrowUp" || key === "k") view?.scrollBy(0, -66);
      else if (key === " " || key === "PageDown") view?.scrollBy(0, page);
      else if (key === "PageUp") view?.scrollBy(0, -page);
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const onClose = (event: MouseEvent<HTMLElement>) =>
    close(event.currentTarget.dataset.path ?? "");

  return (
    <div className={s.root} ref={rootRef}>
      <header className={s.top}>
        <Link
          className={s.who}
          href={GIT}
          data-analytics-event="Navigation Clicked"
          data-analytics-destination="Home"
          data-analytics-location="Header"
        >
          <b>saeed</b>@dubai <i>~/site</i> <em>(main)</em>
        </Link>
        <nav className={s.tabs} aria-label="Tabs">
          {tabs.map((path, index) => (
            <span
              key={path}
              className={s.tab}
              data-active={path === pathname || undefined}
            >
              <Link
                href={path}
                aria-current={path === pathname ? "page" : undefined}
                data-analytics-event="Navigation Clicked"
                data-analytics-destination={tabLabel(path)}
                data-analytics-location="Tabs"
              >
                {index + 1}:{tabLabel(path)}
              </Link>
              {isPage(path) ? (
                <button
                  type="button"
                  className={s.tabClose}
                  aria-label={`Close ${tabLabel(path)}`}
                  data-path={path}
                  onClick={onClose}
                >
                  ×
                </button>
              ) : null}
            </span>
          ))}
        </nav>
        <span className={s.topRight}>
          {/* A plain link, not a soft navigation: the regular site then
              loads fresh, with the theme its visitor had chosen. */}
          <a
            className={s.exit}
            href={toSite(pathname)}
            title="Leave the terminal for the regular site, on this same page"
            data-analytics-event="Navigation Clicked"
            data-analytics-destination="Regular site"
            data-analytics-location="Terminal"
          >
            exit
          </a>
          <LocalClock />
        </span>
      </header>

      <div className={s.body} ref={bodyRef}>
        {seenGit || pathname === GIT ? (
          <GitClient data={data} active={pathname === GIT} />
        ) : null}

        {seenShell || pathname === SHELL ? (
          <main
            className={s.layer}
            data-hidden={pathname !== SHELL || undefined}
            aria-label="Shell"
          >
            <Shell data={data} active={pathname === SHELL} />
          </main>
        ) : null}

        {isPage(pathname) ? (
          <div
            className={`${s.layer} ${s.reader}`}
            data-bare={pathname === OFFICE || undefined}
          >
            <div className={s.page} ref={pageRef} tabIndex={-1} data-region>
              {children}
            </div>
          </div>
        ) : (
          children
        )}
      </div>

      <footer className={s.keys}>
        {pathname === GIT ? (
          <>
            <span>
              <kbd>↑↓</kbd> move
            </span>
            <span>
              <kbd>←→</kbd> pane
            </span>
            <span>
              <kbd>1–5</kbd> jump
            </span>
            <span>
              <kbd>enter</kbd> open
            </span>
            <span>
              <kbd>t</kbd> next tab
            </span>
          </>
        ) : pathname === SHELL ? (
          <span className={s.always}>
            type a command, or press a script · <kbd>menu</kbd> lists them ·
            links open with ⌘ or ctrl and a click
          </span>
        ) : pathname === OFFICE ? (
          <span className={s.always}>
            drag to look around · tap the floor to walk · × on the tab closes it
          </span>
        ) : (
          <>
            <span>
              <kbd>↑↓</kbd> scroll
            </span>
            <span>
              <kbd>space</kbd> page
            </span>
            <span>
              <kbd>q</kbd> close tab
            </span>
            <span>
              <kbd>t</kbd> next tab
            </span>
          </>
        )}
      </footer>
    </div>
  );
}
