"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { TURN, takeTurn } from "@/lib/load-turns";

const loadBackdrop = () =>
  import("@/components/site-backdrop").then((mod) => mod.SiteBackdrop);

// The dither is a full-viewport WebGL loop. It is not part of the first
// paint. Loading it once the page is idle keeps those frames off the
// load trace; the solid background shows until then. On a page with other
// heavy work (the home page's cartridges and books) it waits its turn
// behind them, so its start does not land in their animations.
const SiteBackdrop = dynamic(loadBackdrop, {
  ssr: false,
});

export function DeferredBackdrop() {
  const [ready, setReady] = useState(false);
  useEffect(
    () =>
      takeTurn(
        TURN.backdrop,
        (done) => {
          setReady(true);
          // The turn ends once its code has loaded and it has had two
          // frames to start drawing.
          loadBackdrop()
            .then(() =>
              requestAnimationFrame(() => requestAnimationFrame(done)),
            )
            .catch(done);
        },
        2000,
      ),
    [],
  );
  if (!ready) return null;
  return <SiteBackdrop />;
}
