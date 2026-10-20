"use client";

import { useMemo, useRef } from "react";
import type { InteractiveName } from "@/lib/interactive-names";
import { FigureSkeleton } from "./figure";
import { type InteractiveEntry, interactiveRegistry } from "./registry";
import {
  type FigureHost,
  FigureHostContext,
  useNearViewport,
} from "./use-figure";

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
  const entry: InteractiveEntry = interactiveRegistry[name];
  const Entry = entry.component;
  // Entries are module constants, so this changes only with the name.
  const host = useMemo((): FigureHost => {
    const { component: _, ...layout } = entry;
    return {
      name,
      ...layout,
    };
  }, [
    name,
    entry,
  ]);

  return (
    <FigureHostContext value={host}>
      {near ? <Entry name={name} /> : <FigureSkeleton ref={ref} />}
    </FigureHostContext>
  );
}
