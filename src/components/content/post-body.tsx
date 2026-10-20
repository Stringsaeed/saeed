import {
  type MissingComponentHandler,
  PortableText,
  type PortableTextBlockComponent,
  type PortableTextComponents,
  type PortableTextMarkComponentProps,
} from "@portabletext/react";
import { createImageUrlBuilder } from "@sanity/image-url";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import {
  figcaptionClass,
  figureClass,
} from "@/components/interactive/frame-classes";
import { InteractiveBlock } from "@/components/interactive/interactive-block";
import { isBlogImagePath } from "@/lib/content-patterns";
import { warnOnceInDev } from "@/lib/dev-warn";
import { blockText, headingIds } from "@/lib/heading-ids";
import { highlight } from "@/lib/highlight";
import { isContentHref, isHttpsUrl } from "@/lib/https-url";
import { isInteractiveName } from "@/lib/interactive-names";
import type { ContentBlock } from "@/lib/markdown-to-portable-text";
import { dataset, projectId } from "@/sanity/env";

const imageBuilder = createImageUrlBuilder({
  projectId,
  dataset,
});

function Callout({
  tone = "note",
  children,
}: {
  tone?: string;
  children: ReactNode;
}) {
  const warning = tone === "warning";

  return (
    <aside
      data-tone={warning ? "warning" : "note"}
      className={
        warning
          ? "rounded-lg border border-primary/40 bg-muted px-4 py-3 text-foreground [&>*+*]:mt-3"
          : "rounded-lg border border-border bg-muted px-4 py-3 text-foreground [&>*+*]:mt-3"
      }
    >
      {children}
    </aside>
  );
}

function isSanityImageUrl(src: string) {
  if (!isHttpsUrl(src)) return false;
  try {
    return new URL(src).hostname === "cdn.sanity.io";
  } catch {
    return false;
  }
}

function figureSrc(value: { image?: unknown; src?: unknown }) {
  if (
    typeof value.src === "string" &&
    (isBlogImagePath(value.src) || isSanityImageUrl(value.src))
  ) {
    return value.src;
  }

  if (!value.image || typeof value.image !== "object") return null;
  try {
    const src = imageBuilder
      .image(value.image)
      .width(1600)
      .auto("format")
      .url();
    return isSanityImageUrl(src) ? src : null;
  } catch {
    return null;
  }
}

function FigureBlock({
  value,
}: {
  value?: {
    image?: unknown;
    src?: unknown;
    alt?: unknown;
    caption?: unknown;
  };
}) {
  if (!value) return null;
  const src = figureSrc(value);
  if (!src) return null;
  const alt = typeof value.alt === "string" ? value.alt : "";
  const caption = typeof value.caption === "string" ? value.caption : "";

  return (
    <figure className="space-y-2">
      <Image
        src={src}
        alt={alt}
        width={1600}
        height={900}
        className="h-auto w-full rounded-lg"
      />
      {caption ? (
        <figcaption className="text-sm text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function lineStarts(code: string) {
  const starts: number[] = [];
  let offset = 0;
  for (const line of code.split("\n")) {
    starts.push(offset);
    offset += line.length + 1;
  }
  return starts;
}

async function CodeBlock({
  value,
}: {
  value?: {
    code?: unknown;
    language?: unknown;
  };
}) {
  if (!value || typeof value.code !== "string" || value.code.length === 0)
    return null;
  const lines = await highlight(value.code, value.language);
  if (!lines) {
    return (
      <pre>
        <code>{value.code}</code>
      </pre>
    );
  }

  // Each token carries --shiki-light and --shiki-dark; globals.css picks one
  // by theme, so the server never needs to know which theme a reader has.
  const starts = lineStarts(value.code);
  return (
    <pre className="shiki">
      <code>
        {lines.map((line, index) => (
          <span key={`line-${starts[index] ?? index}`} className="line">
            {line.map((token) => (
              <span
                key={token.offset}
                style={token.htmlStyle as CSSProperties | undefined}
              >
                {token.content}
              </span>
            ))}
            {index < lines.length - 1 ? "\n" : null}
          </span>
        ))}
      </code>
    </pre>
  );
}

function LinkMark({
  value,
  children,
}: PortableTextMarkComponentProps<{
  _type: "link";
  href?: string;
}>) {
  const href = typeof value?.href === "string" ? value.href : "";
  if (!isContentHref(href)) return <>{children}</>;
  const external = href.startsWith("https:");
  return (
    <a
      href={href}
      {...(external
        ? {
            target: "_blank",
            rel: "noreferrer",
          }
        : {})}
    >
      {children}
    </a>
  );
}

function InteractiveSerializer({
  value,
}: {
  value?: {
    name?: unknown;
    caption?: unknown;
  };
}) {
  if (!value) return null;
  if (!isInteractiveName(value.name)) {
    warnOnceInDev(
      `interactive:${String(value.name)}`,
      `[PostBody] Unknown interactive figure "${String(value.name)}"; rendering nothing. Add it to src/lib/interactive-names.ts and the registry.`,
    );
    return null;
  }
  const caption =
    typeof value.caption === "string" && value.caption.trim() !== ""
      ? value.caption
      : null;
  // The figure element and caption are server HTML, so readers without JS,
  // crawlers, and slow hydration still get the author's caption; only the
  // surface inside is a client component.
  return (
    <figure data-interactive={value.name} className={`bleed ${figureClass}`}>
      <InteractiveBlock name={value.name} />
      {caption ? (
        <figcaption className={figcaptionClass}>{caption}</figcaption>
      ) : null}
    </figure>
  );
}

// Content can name block types, marks, or styles this build doesn't render
// yet. Readers see nothing; authors get one console line per kind in dev.
const warnMissingComponent: MissingComponentHandler = (
  message,
  { nodeType, type },
) => warnOnceInDev(`${nodeType}:${type}`, message);

type HeadingIds = ReturnType<typeof headingIds>;

// The `#` link sits beside the heading, not inside it, so the heading's
// accessible name stays its own text. The wrapper is what hover reveals the
// link on; the heading's top margin collapses through it unchanged.
function headingComponent(
  Tag: "h2" | "h3",
  ids: HeadingIds,
): PortableTextBlockComponent {
  return function Heading({ value, children }) {
    const id = ids.get(value);
    if (!id) return <Tag>{children}</Tag>;
    return (
      <div className="heading-anchored">
        <Tag id={id}>{children}</Tag>
        <a
          href={`#${id}`}
          aria-label={`Link to “${blockText(value)}”`}
          className="heading-anchor"
          data-level={Tag}
        >
          #
        </a>
      </div>
    );
  };
}

function createComponents(ids: HeadingIds): PortableTextComponents {
  // Callouts render their body with these same components (and ids), so a
  // heading inside a callout can't reuse an id from the rest of the post.
  function CalloutBlock({
    value,
  }: {
    value?: {
      tone?: unknown;
      body?: ContentBlock[];
    };
  }) {
    if (!value || !Array.isArray(value.body)) return null;
    return (
      <Callout tone={typeof value.tone === "string" ? value.tone : "note"}>
        <PortableText
          components={components}
          value={value.body}
          onMissingComponent={warnMissingComponent}
        />
      </Callout>
    );
  }

  const components: PortableTextComponents = {
    types: {
      callout: CalloutBlock,
      figure: FigureBlock,
      code: CodeBlock,
      interactive: InteractiveSerializer,
    },
    block: {
      h2: headingComponent("h2", ids),
      h3: headingComponent("h3", ids),
    },
    unknownType: () => null,
    marks: {
      link: LinkMark,
    },
  };
  return components;
}

export function PostBody({ value }: { value: ContentBlock[] }) {
  return (
    <PortableText
      components={createComponents(headingIds(value))}
      value={value}
      onMissingComponent={warnMissingComponent}
    />
  );
}
