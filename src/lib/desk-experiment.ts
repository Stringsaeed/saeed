import { useEffect } from "react";
import { capture, loadPostHog } from "./analytics";

export const DESK_VARIANTS = [
  "paperweights",
  "long-take",
] as const;
export type DeskVariant = (typeof DESK_VARIANTS)[number];

// The PostHog experiment's feature flag. Its `control` variant is
// Paperweights; `long-take` is the challenger. Anything else, or no answer in
// time, falls back to Paperweights.
const FLAG = "sticker-desk";
const FLAG_WAIT_MS = 500;
// A story counts as read once it has stayed open this long.
const STORY_READ_MS = 5000;

function variantFrom(value: unknown): DeskVariant {
  return value === "long-take" ? "long-take" : "paperweights";
}

// `?desk=long-take` forces a desk for checking either one; it is never sent
// as an exposure, so it stays out of the results.
function forcedVariant() {
  const value = new URLSearchParams(window.location.search).get("desk");
  return DESK_VARIANTS.find((variant) => variant === value) ?? null;
}

function flagsReady() {
  return loadPostHog().then((posthog) => {
    if (!posthog) return null;
    return new Promise<typeof posthog | null>((resolve) => {
      let done = false;
      let unsubscribe: (() => void) | undefined;
      const finish = (ready: typeof posthog | null) => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        unsubscribe?.();
        resolve(ready);
      };
      const timer = window.setTimeout(() => finish(null), FLAG_WAIT_MS);
      // Calls back at once, before returning, when flags are already loaded.
      unsubscribe = posthog.onFeatureFlags((_flags, _variants, context) =>
        finish(context?.errorsLoading ? null : posthog),
      );
      if (done) unsubscribe();
    });
  });
}

/** The desk a visitor would get, without counting them in the experiment. */
export async function peekDeskVariant() {
  const forced = forcedVariant();
  if (forced) return forced;
  const posthog = await flagsReady();
  return variantFrom(
    posthog?.getFeatureFlag(FLAG, {
      send_event: false,
    }),
  );
}

let chosen: DeskVariant | undefined;

/**
 * The desk to open. The first open of a page view records the exposure and
 * fixes the variant, so a late flag answer never swaps desks mid-visit.
 */
export async function chooseDeskVariant() {
  const forced = forcedVariant();
  if (forced) return forced;
  if (chosen) return chosen;
  const posthog = await flagsReady();
  chosen = variantFrom(posthog?.getFeatureFlag(FLAG));
  return chosen;
}

type DeskSession = {
  desk: DeskVariant;
  openedAt: number;
  read: Set<string>;
};

let session: DeskSession | null = null;

export function startDeskSession(desk: DeskVariant) {
  session = {
    desk,
    openedAt: performance.now(),
    read: new Set(),
  };
  capture("Sticker Desk Opened", {
    desk,
  });
}

export function endDeskSession() {
  if (!session) return;
  capture("Sticker Desk Closed", {
    desk: session.desk,
    seconds: Math.round((performance.now() - session.openedAt) / 1000),
    stories_read: session.read.size,
  });
  session = null;
}

/**
 * Counts `storyId` as read once it stays open for STORY_READ_MS, once per
 * desk session. A no-op outside a session, such as in the prototypes.
 */
export function useStoryReadTracking(storyId: string | null) {
  useEffect(() => {
    if (!storyId) return;
    const timer = window.setTimeout(() => {
      if (!session || session.read.has(storyId)) return;
      session.read.add(storyId);
      capture("Sticker Story Read", {
        desk: session.desk,
        story: storyId,
      });
    }, STORY_READ_MS);
    return () => window.clearTimeout(timer);
  }, [
    storyId,
  ]);
}
