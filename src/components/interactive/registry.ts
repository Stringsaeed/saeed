"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { InteractiveName } from "@/lib/interactive-names";
import { FigureLoading } from "./figure";
import type { InteractiveFigureProps } from "./types";
import type { FigureLayout } from "./use-figure";

// Code-split chunks loaded on the client only (figures are canvas/state
// heavy and have nothing useful to prerender). `header` and the stage size
// must match what the figure renders: the post reserves that box before
// the chunk arrives, so nothing moves when it does. The stage size is
// either `aspect` (figures that draw into a box) or `minHeight` (figures
// whose height follows their content; measure the mounted figure at 375px
// and 688px wide). `satisfies` makes the compiler reject a missing or
// unknown name.
//
// To land a figure, swap its ComingSoon entry for its own import:
//   "pewpew-step": {
//     component: dynamic(
//       () => import("./pewpew/step").then((module) => module.PewpewStep),
//       { ssr: false, loading: FigureLoading },
//     ),
//     minHeight: { base: 1500, sm: 1000 },
//     header: true,
//   },
//
// The PewPew figures all come from one module (pewpew/figures.ts), so they
// share one chunk with the vendored sim instead of each copying it.

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
  "pewpew-hero": {
    component: dynamic(
      () =>
        import("./pewpew/figures").then((module) => ({
          default: module.PewpewHero,
        })),
      {
        ssr: false,
        loading: FigureLoading,
      },
    ),
    aspect: "16 / 9",
    header: true,
  },
  "pewpew-pool": {
    component: dynamic(
      () =>
        import("./pewpew/figures").then((module) => ({
          default: module.PewpewPool,
        })),
      {
        ssr: false,
        loading: FigureLoading,
      },
    ),
    minHeight: {
      base: 610,
      sm: 572,
    },
    header: true,
  },
  "pewpew-step": {
    component: dynamic(
      () =>
        import("./pewpew/figures").then((module) => ({
          default: module.PewpewStep,
        })),
      {
        ssr: false,
        loading: FigureLoading,
      },
    ),
    minHeight: {
      base: 1248,
      sm: 979,
    },
    header: true,
  },
  "pewpew-steer": {
    component: dynamic(
      () =>
        import("./pewpew/figures").then((module) => ({
          default: module.PewpewSteer,
        })),
      {
        ssr: false,
        loading: FigureLoading,
      },
    ),
    minHeight: {
      base: 459,
      sm: 555,
    },
    header: true,
  },
  "pewpew-frame": {
    component: dynamic(
      () =>
        import("./pewpew/figures").then((module) => ({
          default: module.PewpewFrame,
        })),
      {
        ssr: false,
        loading: FigureLoading,
      },
    ),
    minHeight: {
      base: 741,
      sm: 793,
    },
    header: true,
  },
  "pewpew-threads": {
    component: dynamic(
      () =>
        import("./pewpew/figures").then((module) => ({
          default: module.PewpewThreads,
        })),
      {
        ssr: false,
        loading: FigureLoading,
      },
    ),
    minHeight: {
      base: 427,
      sm: 493,
    },
    header: true,
  },
  "pewpew-runtimes": {
    component: dynamic(
      () =>
        import("./pewpew/figures").then((module) => ({
          default: module.PewpewRuntimes,
        })),
      {
        ssr: false,
        loading: FigureLoading,
      },
    ),
    minHeight: {
      base: 980,
      sm: 623,
    },
    header: true,
  },
  "pewpew-level": {
    component: dynamic(
      () =>
        import("./pewpew/figures").then((module) => ({
          default: module.PewpewLevel,
        })),
      {
        ssr: false,
        loading: FigureLoading,
      },
    ),
    minHeight: {
      base: 659,
      sm: 396,
    },
    header: true,
  },
  "pewpew-track": {
    component: dynamic(
      () =>
        import("./pewpew/figures").then((module) => ({
          default: module.PewpewTrack,
        })),
      {
        ssr: false,
        loading: FigureLoading,
      },
    ),
    minHeight: {
      base: 620,
      sm: 670,
    },
    header: true,
  },
  "pewpew-drones": {
    component: dynamic(
      () =>
        import("./pewpew/figures").then((module) => ({
          default: module.PewpewDrones,
        })),
      {
        ssr: false,
        loading: FigureLoading,
      },
    ),
    minHeight: {
      base: 876,
      sm: 804,
    },
    header: true,
  },
  "pewpew-boss": {
    component: dynamic(
      () =>
        import("./pewpew/figures").then((module) => ({
          default: module.PewpewBoss,
        })),
      {
        ssr: false,
        loading: FigureLoading,
      },
    ),
    minHeight: {
      base: 696,
      sm: 548,
    },
    header: true,
  },
  "pewpew-collide": {
    component: dynamic(
      () =>
        import("./pewpew/figures").then((module) => ({
          default: module.PewpewCollide,
        })),
      {
        ssr: false,
        loading: FigureLoading,
      },
    ),
    minHeight: {
      base: 767,
      sm: 628,
    },
    header: true,
  },
  "pewpew-bot": {
    component: dynamic(
      () =>
        import("./pewpew/figures").then((module) => ({
          default: module.PewpewBot,
        })),
      {
        ssr: false,
        loading: FigureLoading,
      },
    ),
    minHeight: {
      base: 265,
      sm: 295,
    },
    header: true,
  },
  "pewpew-proof": {
    component: dynamic(
      () =>
        import("./pewpew/figures").then((module) => ({
          default: module.PewpewProof,
        })),
      {
        ssr: false,
        loading: FigureLoading,
      },
    ),
    minHeight: {
      base: 695,
      sm: 442,
    },
    header: true,
  },
  "pewpew-camera": {
    component: dynamic(
      () =>
        import("./pewpew/figures").then((module) => ({
          default: module.PewpewCamera,
        })),
      {
        ssr: false,
        loading: FigureLoading,
      },
    ),
    minHeight: {
      base: 817,
      sm: 461,
    },
    header: true,
  },
  "pewpew-flow": {
    component: dynamic(
      () =>
        import("./pewpew/figures").then((module) => ({
          default: module.PewpewFlow,
        })),
      {
        ssr: false,
        loading: FigureLoading,
      },
    ),
    minHeight: {
      base: 586,
      sm: 518,
    },
    header: true,
  },
  // Needs upstream's audio engine (src/audio), which is not vendored.
  "pewpew-sound": comingSoon,
} satisfies Record<InteractiveName, InteractiveEntry>;
