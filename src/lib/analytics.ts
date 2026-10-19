import { track } from "@vercel/analytics";
import type { PostHog } from "posthog-js";

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null
>;

// Set by the PostHog integration on Vercel (Preview and Production only), so
// local dev runs without PostHog unless the token is added to .env.local.
const POSTHOG_TOKEN =
  process.env.NEXT_PUBLIC_SAEED_EXPERIMENTATON_POSTHOG_PROJECT_TOKEN;
const POSTHOG_UI_HOST =
  process.env.NEXT_PUBLIC_SAEED_EXPERIMENTATON_POSTHOG_HOST ??
  "https://us.posthog.com";

let posthogLoad: Promise<PostHog | null> | undefined;

/**
 * Loads and starts PostHog once, on first call. Events go through the
 * `/ingest` rewrite in next.config.ts so blockers that drop requests to
 * posthog.com keep them. Resolves null without a project token.
 */
export function loadPostHog() {
  posthogLoad ??=
    POSTHOG_TOKEN && typeof window !== "undefined"
      ? import("posthog-js").then(
          ({ default: posthog }) => {
            posthog.init(POSTHOG_TOKEN, {
              api_host: "/ingest",
              ui_host: POSTHOG_UI_HOST,
              defaults: "2026-08-30",
              person_profiles: "identified_only",
              // No surveys here, so skip downloading their script.
              disable_surveys: true,
              capture_performance: {
                web_vitals: true,
              },
            });
            return posthog;
          },
          () => null,
        )
      : Promise.resolve(null);
  return posthogLoad;
}

/** Sends one event to both Vercel Analytics and PostHog. */
export function capture(event: string, properties?: AnalyticsProperties) {
  track(event, properties);
  void loadPostHog().then((posthog) => posthog?.capture(event, properties));
}
