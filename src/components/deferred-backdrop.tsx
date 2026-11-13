"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { onIdle } from "@/lib/idle";

// The dither is a full-viewport WebGL loop. It is not part of the first
// paint. Loading it once the page is idle keeps those frames off the
// load trace; the solid background shows until then.
const SiteBackdrop = dynamic(
  () => import("@/components/site-backdrop").then((mod) => mod.SiteBackdrop),
  {
    ssr: false,
  },
);

export function DeferredBackdrop() {
  const [ready, setReady] = useState(false);
  useEffect(() => onIdle(() => setReady(true)), []);
  if (!ready) return null;
  return <SiteBackdrop />;
}
