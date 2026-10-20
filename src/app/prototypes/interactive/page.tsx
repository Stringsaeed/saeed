import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostBody } from "@/components/content/post-body";
import { ThemeProvider } from "@/components/theme-provider";
import type { ContentBlock } from "@/lib/markdown-to-portable-text";

// Preview for the interactive-post foundations: figure frame, bleed, code
// highlighting, and heading anchors on one fake post body, inside the same
// column widths as /blog/[slug]. Dev only: production builds answer 404.
// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
  title: "Interactive figure preview",
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

const body: ContentBlock[] = [
  text(
    "intro",
    "A fake post body for checking the pieces interactive explainers sit on. Hover a heading for its anchor; resize to see figures step past the text column.",
  ),
  text("h-loop", "The game loop", "h2"),
  text(
    "p-loop",
    "Every frame the simulation advances by a fixed step, then the renderer draws whatever state it finds. The counter below is the placeholder figure; it lazy-mounts when it comes within 800px of the viewport.",
  ),
  {
    _type: "interactive",
    _key: "demo",
    name: "demo-placeholder",
    caption: "Fig. 1 — a counter standing in for a real figure.",
  },
  text("h-step", "Fixed steps", "h3"),
  text(
    "p-step",
    "Named figures that are not built yet render a quiet frame, so the prose can be drafted around them.",
  ),
  {
    _type: "interactive",
    _key: "step",
    name: "pewpew-step",
    caption: "Fig. 2 — stepping the world at 60 Hz regardless of frame rate.",
  },
  {
    _type: "code",
    _key: "code",
    language: "typescript",
    code: `const STEP = 1 / 60;
let accumulator = 0;

// Advance in fixed steps; render with whatever is left over.
export function frame(dt: number, world: World): number {
  accumulator += Math.min(dt, 0.25);
  while (accumulator >= STEP) {
    world.step(STEP);
    accumulator -= STEP;
  }
  return accumulator / STEP;
}`,
  },
  text("h-loop-2", "The game loop", "h2"),
  text("p-dup", "A repeated heading gets a deduplicated id (the-game-loop-1)."),
];

export default function InteractivePreviewPage() {
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
          Prototype · interactive posts
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-[-0.045em] sm:text-4xl">
          Figure preview
        </h1>
        <div className="article-body mt-10">
          <PostBody value={body} />
        </div>
      </div>
    </ThemeProvider>
  );
}
