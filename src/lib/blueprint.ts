"use client";

import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import {
  BLUEPRINT_ATTRIBUTE,
  BLUEPRINT_BOOTSTRAP_SCRIPT,
  BLUEPRINT_STORAGE_KEY,
} from "./blueprint-script";
import { playSound } from "./sound";

export {
  BLUEPRINT_ATTRIBUTE,
  BLUEPRINT_BOOTSTRAP_SCRIPT,
  BLUEPRINT_STORAGE_KEY,
};

export type BlueprintOrigin = {
  x: number;
  y: number;
};

export type BlueprintDrawingSpec = {
  code: string;
  sheet: string;
  title: string;
};

const listeners = new Set<() => void>();
let enabled: boolean | null = null;
let storageBound = false;

function readInitialState() {
  if (typeof document !== "undefined") {
    if (document.documentElement.hasAttribute(BLUEPRINT_ATTRIBUTE)) {
      return true;
    }
  }
  try {
    return localStorage.getItem(BLUEPRINT_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function applyAttribute(next: boolean) {
  if (typeof document === "undefined") return;
  if (next) {
    document.documentElement.setAttribute(BLUEPRINT_ATTRIBUTE, "");
  } else {
    document.documentElement.removeAttribute(BLUEPRINT_ATTRIBUTE);
  }
}

function notify() {
  for (const listener of listeners) listener();
}

function ensureStorageSync() {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  window.addEventListener("storage", (event) => {
    if (event.key !== BLUEPRINT_STORAGE_KEY) return;
    const next = event.newValue === "true";
    if (enabled === next) return;
    enabled = next;
    applyAttribute(next);
    notify();
  });
}

export function isBlueprintEnabled() {
  if (enabled === null) {
    if (typeof window === "undefined") return false;
    enabled = readInitialState();
    applyAttribute(enabled);
  }
  return enabled;
}

export function subscribeBlueprint(listener: () => void) {
  ensureStorageSync();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const serverSnapshot = () => false;

export function useBlueprint() {
  return useSyncExternalStore(
    subscribeBlueprint,
    isBlueprintEnabled,
    serverSnapshot,
  );
}

export function setBlueprintEnabled(next: boolean, origin?: BlueprintOrigin) {
  const current = isBlueprintEnabled();
  if (current === next) return;

  playSound(next ? "blueprintOn" : "blueprintOff");

  try {
    if (next) {
      localStorage.setItem(BLUEPRINT_STORAGE_KEY, "true");
    } else {
      localStorage.removeItem(BLUEPRINT_STORAGE_KEY);
    }
  } catch {
    /* Private mode: the choice still holds for this visit. */
  }

  const commit = () => {
    enabled = next;
    applyAttribute(next);
    flushSync(notify);
  };

  if (typeof document === "undefined" || typeof window === "undefined") {
    enabled = next;
    return;
  }

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const startTransition = document.startViewTransition?.bind(document);

  if (!startTransition || reduceMotion) {
    commit();
    return;
  }

  const root = document.documentElement;
  root.style.setProperty(
    "--bp-x",
    origin ? `${Math.round(origin.x)}px` : "calc(100vw - 3rem)",
  );
  root.style.setProperty(
    "--bp-y",
    origin ? `${Math.round(origin.y)}px` : "2.25rem",
  );
  root.setAttribute("data-blueprint-wipe", next ? "in" : "out");

  try {
    const transition = startTransition(commit);
    transition.ready.catch(() => {});
    transition.finished
      .catch(() => {})
      .finally(() => {
        root.removeAttribute("data-blueprint-wipe");
      });
  } catch {
    root.removeAttribute("data-blueprint-wipe");
    commit();
  }
}

export function toggleBlueprint(origin?: BlueprintOrigin) {
  setBlueprintEnabled(!isBlueprintEnabled(), origin);
}

type EditableTarget = {
  tagName?: string;
  isContentEditable?: boolean;
  closest?: (selector: string) => unknown;
};

/**
 * Filters global keydowns so pressing `B` toggles blueprint mode everywhere
 * except text inputs, selects, or rich-text editors.
 */
export function shouldHandleBlueprintShortcut(event: {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  repeat?: boolean;
  defaultPrevented?: boolean;
  target?: unknown;
}) {
  if (
    event.defaultPrevented ||
    event.repeat ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey
  ) {
    return false;
  }
  if (event.key !== "b" && event.key !== "B") return false;

  const target = event.target as EditableTarget | null | undefined;
  if (!target) return true;
  if (target.isContentEditable) return false;
  const tag = target.tagName?.toUpperCase();
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return false;
  }
  if (
    typeof target.closest === "function" &&
    target.closest("[contenteditable='true'], [contenteditable='']")
  ) {
    return false;
  }
  return true;
}

export function blueprintDrawingSpec(pathname: string): BlueprintDrawingSpec {
  if (pathname === "/") {
    return {
      code: "SG-01",
      sheet: "01 / 03",
      title: "INDEX & SYSTEM ELEVATION",
    };
  }
  if (pathname === "/blog") {
    return {
      code: "SG-02",
      sheet: "02 / 03",
      title: "WRITING ARCHIVE SCHEDULE",
    };
  }
  if (pathname.startsWith("/blog/")) {
    return {
      code: "SG-02A",
      sheet: "02A / 03",
      title: "TECHNICAL FIELD NOTE",
    };
  }
  if (pathname.startsWith("/links")) {
    return {
      code: "SG-03",
      sheet: "03 / 03",
      title: "REFERENCE & TOOLING TABLE",
    };
  }
  return {
    code: "SG-00",
    sheet: "AUX",
    title: "PROTOTYPE SCHEMATIC",
  };
}
