import {
  PortableText,
  type PortableTextComponents,
  type PortableTextMarkComponentProps,
} from "@portabletext/react";
import { createImageUrlBuilder } from "@sanity/image-url";
import Image from "next/image";
import type { ReactNode } from "react";
import { isBlogImagePath } from "@/lib/content-patterns";
import { isContentHref, isHttpsUrl } from "@/lib/https-url";
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

function CodeBlock({
  value,
}: {
  value?: {
    code?: unknown;
  };
}) {
  if (!value || typeof value.code !== "string" || value.code.length === 0)
    return null;
  return (
    <pre>
      <code>{value.code}</code>
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
      <PostBody value={value.body} />
    </Callout>
  );
}

const components: PortableTextComponents = {
  types: {
    callout: CalloutBlock,
    figure: FigureBlock,
    code: CodeBlock,
  },
  unknownType: () => null,
  marks: {
    link: LinkMark,
  },
};

export function PostBody({ value }: { value: ContentBlock[] }) {
  return <PortableText components={components} value={value} />;
}
