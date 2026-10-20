"use client";

import { useMemo, useRef } from "react";
import type { InteractiveName } from "@/lib/interactive-names";
import { FigureSkeleton } from "./figure";
import { interactiveRegistry } from "./registry";
import { FigureHostContext, useNearViewport } from "./use-figure";

export type InteractiveBlockProps = {
  name: InteractiveName;
};

/**
 * The surface of a figure named in a post. The server renders the
 * surrounding <figure> and caption; this holds a skeleton of the
 * registry's exact size until the reader is within 800px, then loads the
 * figure's chunk into it.
 */
export function InteractiveBlock({ name }: InteractiveBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useNearViewport(ref);
  const { component: Entry, aspect, header } = interactiveRegistry[name];
  const host = useMemo(
    () => ({
      name,
      aspect,
      header,
    }),
    [
      name,
      aspect,
      header,
    ],
  );

  return (
    <FigureHostContext value={host}>
      {near ? <Entry name={name} /> : <FigureSkeleton ref={ref} />}
    </FigureHostContext>
  );
}
