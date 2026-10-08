"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

// Matches the breakpoint where globals.css stops hiding `.sticker-field`.
const DESKTOP_QUERY = "(min-width: 960px)";

// The field places its stickers after mount anyway, so skipping SSR costs
// nothing visible, and narrow screens never download its code or images.
const StickerField = dynamic(
  () => import("./sticker-field").then((module) => module.StickerField),
  {
    ssr: false,
  },
);

function subscribe(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function DesktopStickerField() {
  const isDesktop = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return isDesktop ? <StickerField /> : null;
}
