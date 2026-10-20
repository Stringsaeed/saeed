import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostBody } from "@/components/content/post-body";
import { ThemeProvider } from "@/components/theme-provider";
import {
  PEWPEW_CAPTIONS,
  type PewpewFigureName,
} from "@/explainers/pewpew/captions";
import type { ContentBlock } from "@/lib/markdown-to-portable-text";

// Every PewPew figure in the post's order, under the section headings of
// the upstream draft (explainer/post.md), with the captions the Sanity
// import attaches (src/explainers/pewpew/captions.ts). For checking each
// figure in the real post layout. Dev only: production builds answer 404.
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
  name: PewpewFigureName;
};

const SECTIONS: Section[] = [
  {
    name: "pewpew-hero",
  },
  {
    heading: "The world is a table of numbers",
    name: "pewpew-pool",
  },
  {
    heading: "One step runs ten stages in a fixed order",
    name: "pewpew-step",
  },
  {
    heading: "Your finger sets a target, not a position",
    name: "pewpew-steer",
  },
  {
    heading: "Frames turn into whole steps",
    name: "pewpew-frame",
  },
  {
    heading: "Each part runs in a different place",
    name: "pewpew-threads",
  },
  {
    name: "pewpew-runtimes",
  },
  {
    heading: "Levels are data",
    name: "pewpew-level",
  },
  {
    name: "pewpew-track",
  },
  {
    heading: "Drones follow patterns, and bosses follow their health",
    name: "pewpew-drones",
  },
  {
    name: "pewpew-boss",
  },
  {
    heading: "Collisions depend on a body's role",
    name: "pewpew-collide",
  },
  {
    heading: "The bot plays every level for the verifier",
    name: "pewpew-bot",
  },
  {
    heading: "The proof compares hashes",
    name: "pewpew-proof",
  },
  {
    heading: "The renderer draws a frame in four parts",
    name: "pewpew-camera",
  },
  {
    heading: "Every sound is synthesized",
    name: "pewpew-sound",
  },
  {
    heading: "Screens and the save use the same pure style",
    name: "pewpew-flow",
  },
];

const body: ContentBlock[] = [
  text(
    "intro",
    "Every PewPew figure in post order, with the post's captions. The sound figure is listed here but held out of the post until it is ported. Scroll a figure off screen and it pauses.",
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
      caption: PEWPEW_CAPTIONS[section.name],
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
