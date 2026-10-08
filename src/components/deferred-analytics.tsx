"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { onIdle } from "@/lib/idle";

// The same queue @vercel/analytics sets up on inject, installed up front so
// `track()` calls made before the deferred script arrives are kept, not lost.
if (typeof window !== "undefined" && !window.va) {
  window.va = (
    ...params: [
      string,
      unknown?,
    ]
  ) => {
    window.vaq ??= [];
    window.vaq.push(params);
  };
}

const Analytics = dynamic(
  () => import("@vercel/analytics/next").then((module) => module.Analytics),
  {
    ssr: false,
  },
);
const SpeedInsights = dynamic(
  () =>
    import("@vercel/speed-insights/next").then(
      (module) => module.SpeedInsights,
    ),
  {
    ssr: false,
  },
);

/**
 * Mounts Vercel Analytics and Speed Insights once the page settles. Both only
 * inject a script on mount, and Speed Insights reads buffered performance
 * entries, so starting late loses nothing but keeps them off the first paint.
 */
export function DeferredAnalytics() {
  const [ready, setReady] = useState(false);

  useEffect(() => onIdle(() => setReady(true)), []);

  if (!ready) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
