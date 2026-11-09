import { RiArrowLeftLine, RiArrowLeftSLine } from "@remixicon/react";
import Link from "next/link";
import { type ReactNode, ViewTransition } from "react";
import type { App } from "@/data/apps";
import { MorphingAppIcon } from "./app-icon";

// The chrome around every screen that is not the home screen: a back
// control, the title, and the content. Opening from the home screen zooms
// out of the icon (the "app" transition); a screen reached from a list
// slides in like a navigation push.

type Back = {
  href: `/${string}`;
  label: string;
  /** "app" closes back to the home screen; "pop" returns to a parent list. */
  kind?: "app" | "pop";
};

const enter = {
  "app-open": "app-enter",
  "app-close": "app-reenter",
  push: "push-enter",
  pop: "pop-enter",
  default: "none",
};

const exit = {
  "app-open": "app-leave",
  "app-close": "app-exit",
  push: "push-leave",
  pop: "pop-leave",
  default: "none",
};

export function ScreenTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={enter} exit={exit} default="none">
      {children}
    </ViewTransition>
  );
}

export function AppWindow({
  app,
  title,
  icon,
  back = {
    href: "/",
    label: "Home",
    kind: "app",
  },
  lede,
  children,
  analyticsLabel,
}: {
  /** The app this screen belongs to; its icon morphs in from the home screen. */
  app?: App;
  title: string;
  /** Replaces the app icon beside the title; null for none, when the
   *  screen carries its own hero that morphs in instead. */
  icon?: ReactNode;
  back?: Back;
  lede?: ReactNode;
  children: ReactNode;
  analyticsLabel?: string;
}) {
  const kind = back.kind ?? "app";
  return (
    <ScreenTransition>
      <div
        className="os-window"
        data-analytics-view="Content Viewed"
        data-analytics-label={analyticsLabel ?? title}
      >
        <header className="os-appbar">
          <div className="os-appbar-row">
            <Link
              className="os-back"
              href={back.href}
              transitionTypes={[
                kind === "app" ? "app-close" : "pop",
              ]}
              data-sound="tap"
              data-analytics-event="Navigation Clicked"
              data-analytics-destination={back.label}
              data-analytics-location="App Bar"
            >
              <RiArrowLeftSLine aria-hidden="true" data-ios-only="" />
              <RiArrowLeftLine aria-hidden="true" data-android-only="" />
              <span>{back.label}</span>
            </Link>
          </div>
          <div className="os-appbar-title">
            {icon !== undefined ? (
              icon
            ) : app ? (
              <MorphingAppIcon app={app} size={34} />
            ) : null}
            <h1>{title}</h1>
          </div>
        </header>
        <div className="os-content">
          {lede ? <p className="os-lede">{lede}</p> : null}
          {children}
        </div>
      </div>
    </ScreenTransition>
  );
}
