"use client";

import { useRef } from "react";
import type { InteractiveName } from "@/lib/interactive-names";
import { FigureSkeleton } from "./figure";
import { interactiveRegistry } from "./registry";
import { useNearViewport } from "./use-figure";

export type InteractiveBlockProps = {
  name: InteractiveName;
  caption?: string;
};

/**
 * A figure named in a post. Holds an empty frame until the reader is within
 * 800px, then fetches the figure's chunk; the server sends only the frame.
 */
export function InteractiveBlock({ name, caption }: InteractiveBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useNearViewport(ref);
  const Entry = interactiveRegistry[name];

  if (!near) return <FigureSkeleton ref={ref} name={name} />;
  return <Entry name={name} caption={caption} />;
}
