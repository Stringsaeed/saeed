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
// whose height follows their content: one height per stage width in
// MIN_HEIGHT_WIDTHS, measured from the mounted figure across 320–768px
// viewports and fitted so the interpolated reservation never falls below
// it). `satisfies` makes the compiler reject a missing or unknown name.
//
// To land a figure, swap its ComingSoon entry for its own import:
//   "my-figure": {
//     component: dynamic(
//       () => import("./my-figure").then((module) => module.MyFigure),
//       { ssr: false, loading: FigureLoading },
//     ),
//     aspect: "16 / 9",
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
    minHeight: [
      610,
      610,
      610,
      610,
      610,
      619,
      590,
      590,
      606,
      586,
      572,
      572,
      572,
      572,
      572,
      590,
      571,
      572,
      572,
      572,
    ],
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
    minHeight: [
      1331,
      1301,
      1248,
      1248,
      1295,
      1198,
      1196,
      1141,
      1141,
      1141,
      1141,
      1141,
      1141,
      1141,
      1141,
      1177,
      1139,
      1055,
      1007,
      979,
    ],
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
    minHeight: [
      519,
      479,
      456,
      461,
      466,
      472,
      477,
      482,
      488,
      493,
      498,
      503,
      509,
      514,
      519,
      547,
      528,
      539,
      547,
      555,
    ],
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
    minHeight: [
      839,
      856,
      796,
      743,
      748,
      764,
      734,
      769,
      726,
      731,
      736,
      746,
      746,
      757,
      757,
      803,
      765,
      776,
      793,
      793,
    ],
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
    minHeight: [
      468,
      448,
      422,
      434,
      434,
      419,
      425,
      431,
      438,
      428,
      428,
      440,
      440,
      452,
      452,
      481,
      462,
      474,
      484,
      493,
    ],
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
    minHeight: [
      436,
      436,
      436,
      436,
      436,
      436,
      436,
      436,
      436,
      436,
      436,
      436,
      436,
      436,
      436,
      436,
      436,
      642,
      642,
      642,
    ],
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
    minHeight: [
      668,
      668,
      699,
      651,
      672,
      620,
      605,
      605,
      619,
      584,
      584,
      584,
      584,
      584,
      584,
      602,
      583,
      396,
      396,
      396,
    ],
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
    minHeight: [
      712,
      682,
      624,
      621,
      626,
      629,
      636,
      636,
      648,
      626,
      630,
      634,
      637,
      644,
      644,
      669,
      650,
      659,
      665,
      670,
    ],
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
    minHeight: [
      916,
      906,
      876,
      876,
      876,
      876,
      876,
      876,
      876,
      876,
      876,
      876,
      876,
      876,
      876,
      894,
      875,
      804,
      804,
      804,
    ],
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
    minHeight: [
      704,
      719,
      694,
      697,
      731,
      673,
      636,
      641,
      644,
      651,
      651,
      656,
      659,
      666,
      666,
      691,
      672,
      536,
      542,
      548,
    ],
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
    minHeight: [
      746,
      771,
      756,
      776,
      786,
      809,
      759,
      789,
      745,
      731,
      731,
      731,
      731,
      731,
      731,
      749,
      730,
      628,
      628,
      628,
    ],
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
    minHeight: [
      250,
      261,
      261,
      294,
      254,
      260,
      265,
      270,
      298,
      278,
      258,
      243,
      249,
      254,
      259,
      287,
      268,
      279,
      287,
      295,
    ],
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
    minHeight: [
      838,
      802,
      730,
      695,
      701,
      674,
      705,
      643,
      613,
      607,
      547,
      555,
      515,
      502,
      502,
      520,
      501,
      445,
      445,
      442,
    ],
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
    minHeight: [
      780,
      800,
      802,
      822,
      822,
      846,
      816,
      800,
      777,
      777,
      777,
      777,
      777,
      777,
      777,
      795,
      776,
      461,
      461,
      461,
    ],
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
    minHeight: [
      586,
      586,
      586,
      586,
      552,
      552,
      552,
      552,
      552,
      552,
      583,
      521,
      518,
      518,
      518,
      536,
      517,
      518,
      518,
      518,
    ],
    header: true,
  },
  // Needs upstream's audio engine (src/audio), which is not vendored.
  "pewpew-sound": comingSoon,
} satisfies Record<InteractiveName, InteractiveEntry>;
