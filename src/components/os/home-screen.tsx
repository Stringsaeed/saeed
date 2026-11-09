"use client";

import { RiSearchLine } from "@remixicon/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type App,
  builtInApps,
  dockAppIds,
  findBuiltInApp,
  shippedProjectApps,
  sideProjectApps,
} from "@/data/apps";
import type { BlogPost } from "@/lib/content";
import { MorphingAppIcon } from "./app-icon";
import { ScreenTransition } from "./app-window";
import {
  AboutWidget,
  ClockWidget,
  ShippedWidget,
  SideProjectsWidget,
  WritingWidget,
} from "./widgets";

// Three pages of home screen. The first is about me; the second holds the
// apps I shipped at work; the third, my own. The dock stays put.

const gridApps = builtInApps.filter(
  (app) => !dockAppIds.includes(app.id) && app.id !== "projects",
);

function AppLink({
  app,
  location,
  priority,
}: {
  app: App;
  location: string;
  priority?: boolean;
}) {
  return (
    <Link
      className="os-app"
      href={app.href}
      transitionTypes={[
        "app-open",
      ]}
      data-sound="tap"
      data-analytics-event="App Opened"
      data-analytics-label={app.name}
      data-analytics-location={location}
    >
      <MorphingAppIcon app={app} priority={priority} />
      <span className="os-app-label">{app.name}</span>
    </Link>
  );
}

const pageNames = [
  "About",
  "Shipped at work",
  "Side projects",
];

export function HomeScreen({ posts }: { posts: readonly BlogPost[] }) {
  const pagesRef = useRef<HTMLElement>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const pages = pagesRef.current;
    if (!pages) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const width = pages.clientWidth || 1;
      setPage(Math.round(pages.scrollLeft / width));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    pages.addEventListener("scroll", onScroll, {
      passive: true,
    });
    return () => {
      pages.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const goTo = useCallback((index: number) => {
    const pages = pagesRef.current;
    if (!pages) return;
    pages.scrollTo({
      left: index * pages.clientWidth,
      behavior: "smooth",
    });
  }, []);

  // Arrow keys page when the focus is on the dots.
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowRight") goTo(Math.min(page + 1, 2));
      if (event.key === "ArrowLeft") goTo(Math.max(page - 1, 0));
    },
    [
      goTo,
      page,
    ],
  );

  return (
    <ScreenTransition>
      <div className="os-home" data-analytics-view="Content Viewed" data-analytics-label="Home Screen">
        <h1 className="sr-only">Saeed, a software engineer. This site is a phone.</h1>
        <section
          ref={pagesRef}
          className="os-pages"
          aria-roledescription="carousel"
          aria-label="Home screen pages"
        >
          <section
            className="os-page"
            aria-label={pageNames[0]}
            aria-hidden={page !== 0 || undefined}
          >
            <div className="os-grid">
              <AboutWidget />
              <ClockWidget />
              <WritingWidget post={posts[0]} />
              {gridApps.map((app) => (
                <AppLink key={app.id} app={app} location="Home Page 1" priority />
              ))}
            </div>
          </section>
          <section
            className="os-page"
            aria-label={pageNames[1]}
            aria-hidden={page !== 1 || undefined}
          >
            <div className="os-grid">
              <ShippedWidget />
              {shippedProjectApps.map((app) => (
                <AppLink key={app.id} app={app} location="Home Page 2" />
              ))}
            </div>
          </section>
          <section
            className="os-page"
            aria-label={pageNames[2]}
            aria-hidden={page !== 2 || undefined}
          >
            <div className="os-grid">
              <SideProjectsWidget />
              {sideProjectApps.map((app) => (
                <AppLink key={app.id} app={app} location="Home Page 3" />
              ))}
            </div>
          </section>
        </section>

        <div className="os-dots" role="tablist" aria-label="Home screen pages">
          {pageNames.map((name, index) => (
            <button
              key={name}
              type="button"
              role="tab"
              className="os-dot"
              aria-label={name}
              aria-selected={page === index}
              aria-current={page === index ? "true" : undefined}
              onClick={() => goTo(index)}
              onKeyDown={onKeyDown}
              data-sound="tap"
            />
          ))}
        </div>

        <Link
          className="os-search"
          href="/links"
          transitionTypes={[
            "app-open",
          ]}
          data-sound="tap"
          data-analytics-event="App Opened"
          data-analytics-label="Links"
          data-analytics-location="Search Pill"
        >
          <RiSearchLine aria-hidden="true" />
          <span>Search my saved links</span>
        </Link>

        <nav className="os-dock" aria-label="Dock">
          {dockAppIds.map((id) => {
            const app = findBuiltInApp(id);
            return (
              <Link
                key={id}
                className="os-dock-item"
                href={app.href}
                transitionTypes={[
                  "app-open",
                ]}
                aria-label={app.name}
                title={app.name}
                data-sound="tap"
                data-analytics-event="App Opened"
                data-analytics-label={app.name}
                data-analytics-location="Dock"
              >
                <MorphingAppIcon app={app} priority />
              </Link>
            );
          })}
        </nav>
      </div>
    </ScreenTransition>
  );
}
