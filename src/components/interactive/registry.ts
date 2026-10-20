"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { InteractiveName } from "@/lib/interactive-names";
import { FigureLoading } from "./figure";
import type { InteractiveFigureProps } from "./types";

// One code-split chunk per figure, loaded on the client only (figures are
// canvas/state heavy and have nothing useful to prerender). `satisfies`
// makes the compiler reject a missing or unknown name.
//
// To land a figure, swap its ComingSoon entry for its own import:
//   "pewpew-step": dynamic(
//     () => import("./pewpew/step").then((module) => module.PewpewStep),
//     { ssr: false, loading: FigureLoading },
//   ),

const DemoPlaceholder = dynamic(
  () => import("./demo-placeholder").then((module) => module.DemoPlaceholder),
  {
    ssr: false,
    loading: FigureLoading,
  },
);

const ComingSoon = dynamic(
  () => import("./coming-soon").then((module) => module.ComingSoon),
  {
    ssr: false,
    loading: FigureLoading,
  },
);

export const interactiveRegistry = {
  "demo-placeholder": DemoPlaceholder,
  "pewpew-hero": ComingSoon,
  "pewpew-pool": ComingSoon,
  "pewpew-step": ComingSoon,
  "pewpew-steer": ComingSoon,
  "pewpew-frame": ComingSoon,
  "pewpew-threads": ComingSoon,
  "pewpew-runtimes": ComingSoon,
  "pewpew-level": ComingSoon,
  "pewpew-track": ComingSoon,
  "pewpew-drones": ComingSoon,
  "pewpew-boss": ComingSoon,
  "pewpew-collide": ComingSoon,
  "pewpew-bot": ComingSoon,
  "pewpew-proof": ComingSoon,
  "pewpew-camera": ComingSoon,
  "pewpew-flow": ComingSoon,
  "pewpew-sound": ComingSoon,
} satisfies Record<InteractiveName, ComponentType<InteractiveFigureProps>>;
