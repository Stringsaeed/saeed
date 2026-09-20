import Image from "next/image";
import type { ReactNode } from "react";
import { isBlogImagePath } from "@/lib/content-patterns";

export function Callout({
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

export function Figure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string | null;
}) {
  if (!isBlogImagePath(src)) {
    return null;
  }

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
