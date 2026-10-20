import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostBody } from "@/components/content/post-body";
import { ThemeProvider } from "@/components/theme-provider";
import type { InteractiveName } from "@/lib/interactive-names";
import type { ContentBlock } from "@/lib/markdown-to-portable-text";

// Every PewPew figure in the post's order, under the section headings of
// the upstream draft (explainer/post.md), with upstream's figure captions
// as placeholder Sanity captions. For checking each figure in the real post
// layout. Dev only: production builds answer 404.
// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
  title: "PewPew figure preview",
  robots: {
    index: false,
    follow: false,
  },
};

function text(key: string, value: string, style = "normal"): ContentBlock {
  return {
    _type: "block",
    _key: key,
    style,
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: `${key}-span`,
        text: value,
        marks: [],
      },
    ],
  };
}

type Section = {
  heading?: string;
  name: InteractiveName;
  caption: string;
};

// Captions are upstream's fig.caption() text (steer's with its computed
// values filled in), placeholders until the post's Sanity captions exist.
const SECTIONS: Section[] = [
  {
    name: "pewpew-hero",
    caption:
      "createLoop, resetRun, advance, step, and greedyBot are imported from the game's source. This is the 2D sim view; the WebGPU renderer is not part of this site.",
  },
  {
    heading: "The world is a table of numbers",
    name: "pewpew-pool",
    caption:
      "The real remove() from src/sim/world.ts, applied to this live pool.",
  },
  {
    heading: "One step runs ten stages in a fixed order",
    name: "pewpew-step",
    caption:
      "Each › runs the real stage function on a copy of the world and lists what it changed. Yellow rings mark bodies that a stage created or damaged. Click a dotted name to open its source.",
  },
  {
    heading: "Your finger sets a target, not a position",
    name: "pewpew-steer",
    caption:
      "The plot calls the real steerVelocity 180 times. After the finger lifts, velocity is multiplied by COAST_DAMPING (0.9) each step. A full-width drag moves the target 11.25 units: dragInput(0, 1) = 4.",
  },
  {
    heading: "Frames turn into whole steps",
    name: "pewpew-frame",
    caption:
      "Each time the walk returns to line 1, it calls the real advance() once with a fake clock. The squares are the step() calls each frame ran.",
  },
  {
    heading: "Each part runs in a different place",
    name: "pewpew-threads",
    caption:
      'Each column is one hop in the life of a frame. Click a dot to jump to it. Lit rows are the places involved. Switch to "In this page" to see where the same code runs as you read.',
  },
  {
    name: "pewpew-runtimes",
    caption: "Every file, and where it runs.",
  },
  {
    heading: "Levels are data",
    name: "pewpew-level",
    caption:
      "The row is read live from LEVELS in src/levels.ts, and the verifier line from the golden file. Click any field name.",
  },
  {
    name: "pewpew-track",
    caption:
      "The strip is the real output of compileTrack for the chosen level, from the start (left) to the wormhole (right). Hover a dot for its spawn.",
  },
  {
    heading: "Drones follow patterns, and bosses follow their health",
    name: "pewpew-drones",
    caption:
      "All four paths are drawn by running the real pattern functions until the drone passes the rocket. The current one is bright.",
  },
  {
    name: "pewpew-boss",
    caption:
      "The highlighted card is what the real bossPhase returns for this hp. There is no phase variable to keep in sync: damage alone moves the fight forward.",
  },
  {
    heading: "Collisions depend on a body's role",
    name: "pewpew-collide",
    caption:
      "Move the pointer over the dark box to move the rocket. Each move calls the real collide() on a one-body world, and the lit lines are the path it took.",
  },
  {
    heading: "The bot plays every level for the verifier",
    name: "pewpew-bot",
    caption:
      "The bot only ever outputs a target lane (thin line, whole units). Steering turns that into the smooth thick line. The level runs left to right.",
  },
  {
    heading: "The proof compares hashes",
    name: "pewpew-proof",
    caption:
      "Everything here runs the game's own simulate, replay, step, and hashWorld. Every level's golden row is checked into the repo, and npm run verify fails when a run stops matching it.",
  },
  {
    heading: "The renderer draws a frame in four parts",
    name: "pewpew-camera",
    caption:
      "The track walls (x = ±4.5) and 5-unit rows, projected with the real uniform block. The camera backs off on narrow screens so the whole track width always fits.",
  },
  {
    heading: "Every sound is synthesized",
    name: "pewpew-sound",
    caption:
      "Every sound is made by the game's createAudio with a browser AudioContext in place of the native one. The buttons send the same SimEvents the sim emits. won and lost also stop the music, as they do in the game.",
  },
  {
    heading: "Screens and the save use the same pure style",
    name: "pewpew-flow",
    caption:
      'Disabled buttons are actions this screen ignores: reduce returns the same object. "pick level 2" only works once level 1 has a star, because isUnlocked reads the save.',
  },
];

const body: ContentBlock[] = [
  text(
    "intro",
    "Every PewPew figure in post order, with upstream's captions as placeholders. Scroll a figure off screen and it pauses.",
  ),
  ...SECTIONS.flatMap((section): ContentBlock[] => [
    ...(section.heading
      ? [
          text(`h-${section.name}`, section.heading, "h2"),
        ]
      : []),
    {
      _type: "interactive",
      _key: section.name,
      name: section.name,
      caption: section.caption,
    },
  ]),
];

export default function PewpewPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="mx-auto w-full max-w-176 px-6 pt-12 pb-24 sm:px-8">
        <p className="font-mono text-xs text-muted-foreground">
          Prototype · PewPew figures ·{" "}
          <Link className="text-link" href="/prototypes/pewpew-post">
            Preview the post
          </Link>
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-[-0.045em] sm:text-4xl">
          How pewpew works
        </h1>
        <div className="article-body mt-10">
          <PostBody value={body} />
        </div>
      </div>
    </ThemeProvider>
  );
}
