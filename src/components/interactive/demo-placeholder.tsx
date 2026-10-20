"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Figure, FigurePlayButton } from "./figure";
import type { InteractiveFigureProps } from "./types";
import { useFigure, useFigureLoop } from "./use-figure";

function Stage({ count, onAdd }: { count: number; onAdd: () => void }) {
  const { reducedMotion, active } = useFigure();
  const clock = useRef<HTMLSpanElement>(null);
  const elapsed = useRef(0);

  // Written straight to the DOM each frame, the way a canvas figure would
  // draw, instead of re-rendering React 60 times a second.
  useFigureLoop(({ dt }) => {
    elapsed.current += dt;
    if (clock.current) clock.current.textContent = elapsed.current.toFixed(1);
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <output
          aria-live="polite"
          className="font-mono text-5xl font-medium tabular-nums tracking-tight"
        >
          {count}
        </output>
        <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
          <span ref={clock}>0.0</span>s {active ? "running" : "paused"} ·
          reduced motion {reducedMotion ? "on" : "off"}
        </p>
      </div>
      {/* Flush with the stage's bottom edge on purpose: exercises the
          inset focus rule and the radius clip. */}
      <Button
        type="button"
        variant="ghost"
        className="w-full rounded-none"
        data-sound="tap"
        onClick={onAdd}
      >
        Add one
      </Button>
    </div>
  );
}

// Exercises the figure pipeline end to end (Sanity block → registry → lazy
// chunk → frame → loop) without any real figure code. Used by the
// /prototypes/interactive preview.
export function DemoPlaceholder({ name }: InteractiveFigureProps) {
  const [count, setCount] = useState(0);
  const reset = useCallback(() => setCount(0), []);
  const increment = useCallback(() => setCount((value) => value + 1), []);

  return (
    <Figure
      name={name}
      title="Counter"
      aspect="2 / 1"
      controls={
        <>
          <FigurePlayButton />
          <Button
            type="button"
            variant="tertiary"
            size="compact"
            data-sound="tap"
            disabled={count === 0}
            onClick={reset}
          >
            Reset
          </Button>
        </>
      }
    >
      <Stage count={count} onAdd={increment} />
    </Figure>
  );
}
