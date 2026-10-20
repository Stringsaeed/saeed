"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { InteractiveName } from "@/lib/interactive-names";
import { FigureLoading } from "./figure";
import type { InteractiveFigureProps } from "./types";
import type { FigureLayout } from "./use-figure";

// One code-split chunk per figure, loaded on the client only (figures are
// canvas/state heavy and have nothing useful to prerender). `aspect` and
// `header` must match what the figure renders: the post reserves exactly
// that box before the chunk arrives, so nothing moves when it does.
// `satisfies` makes the compiler reject a missing or unknown name.
//
// To land a figure, swap its ComingSoon entry for its own import:
//   "pewpew-step": {
//     component: dynamic(
//       () => import("./pewpew/step").then((module) => module.PewpewStep),
//       { ssr: false, loading: FigureLoading },
//     ),
//     aspect: "16 / 9",
//     header: true,
//   },

export type InteractiveEntry = FigureLayout & {
  component: ComponentType<InteractiveFigureProps>;
};

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

const comingSoon: InteractiveEntry = {
  component: ComingSoon,
  aspect: "16 / 9",
  header: false,
};

export const interactiveRegistry = {
  "demo-placeholder": {
    component: DemoPlaceholder,
    aspect: "2 / 1",
    header: true,
  },
  "pewpew-hero": comingSoon,
  "pewpew-pool": comingSoon,
  "pewpew-step": comingSoon,
  "pewpew-steer": comingSoon,
  "pewpew-frame": comingSoon,
  "pewpew-threads": comingSoon,
  "pewpew-runtimes": comingSoon,
  "pewpew-level": comingSoon,
  "pewpew-track": comingSoon,
  "pewpew-drones": comingSoon,
  "pewpew-boss": comingSoon,
  "pewpew-collide": comingSoon,
  "pewpew-bot": comingSoon,
  "pewpew-proof": comingSoon,
  "pewpew-camera": comingSoon,
  "pewpew-flow": comingSoon,
  "pewpew-sound": comingSoon,
} satisfies Record<InteractiveName, InteractiveEntry>;
