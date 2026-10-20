"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Figure } from "./figure";
import type { InteractiveFigureProps } from "./types";
import { useFigure } from "./use-figure";

function Counter({ count }: { count: number }) {
  const { reducedMotion } = useFigure();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <output
        aria-live="polite"
        className="font-mono text-5xl font-medium tabular-nums tracking-tight"
      >
        {count}
      </output>
      <p className="font-mono text-[11px] text-muted-foreground">
        reduced motion {reducedMotion ? "on" : "off"}
      </p>
    </div>
  );
}

// Exercises the figure pipeline end to end (Sanity block → registry → lazy
// chunk → frame) without any real figure code. Used by tests and the
// /prototypes/interactive preview.
export function DemoPlaceholder({ name, caption }: InteractiveFigureProps) {
  const [count, setCount] = useState(0);
  const reset = useCallback(() => setCount(0), []);
  const increment = useCallback(() => setCount((value) => value + 1), []);

  return (
    <Figure
      name={name}
      caption={caption}
      title="Counter"
      aspect="2 / 1"
      controls={
        <>
          <Button
            variant="tertiary"
            size="compact"
            data-sound="tap"
            disabled={count === 0}
            onClick={reset}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            size="compact"
            data-sound="tap"
            onClick={increment}
          >
            Add one
          </Button>
        </>
      }
    >
      <Counter count={count} />
    </Figure>
  );
}
