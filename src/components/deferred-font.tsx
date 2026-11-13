"use client";

import { useEffect } from "react";
import { onIdle } from "@/lib/idle";

// Paper Mono is a 53KB variable file used for dates and labels. The first
// paint uses the metric-matched fallback already in CSS. Adding the next/font
// variable after idle is what starts the download, so it does not sit on the
// simulated LCP path with the render-blocking stylesheets.
export function DeferredFontClass({ name }: { name: string }) {
  useEffect(
    () =>
      onIdle(() => {
        for (const token of name.split(" ")) {
          if (token) document.documentElement.classList.add(token);
        }
      }),
    [
      name,
    ],
  );
  return null;
}
