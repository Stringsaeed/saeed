"use client";

import { motion, useReducedMotion } from "framer-motion";
import { type CSSProperties, type ReactNode, type Ref, useRef } from "react";
import { useShape } from "@/lib/shape-context";
import { spring } from "@/lib/springs";
import { cn } from "@/lib/utils";
import { FigureContext, useNearViewport } from "./use-figure";

// The frame every interactive figure in a post sits in: the site's outlined
// surface, an optional title/controls row, and a mono caption. Children mount
// only once the figure is near the viewport, so a long post with many
// figures pays for the ones a reader actually reaches. The frame itself is
// not focusable; children own focus.

const surface =
  "smooth-shadow-ring shadow-black smooth-ring-neutral-300/30 bg-background";

function aspectStyle(aspect: FigureProps["aspect"]): CSSProperties | undefined {
  return aspect === undefined
    ? undefined
    : {
        aspectRatio: aspect,
      };
}

export type FigureProps = {
  /** Registry name; lands on `data-interactive` for analytics and tests. */
  name?: string;
  title?: ReactNode;
  caption?: ReactNode;
  /** Slot on the right of the title row (play/pause/step, reset…). */
  controls?: ReactNode;
  /** CSS aspect-ratio for the stage, e.g. `"16 / 9"` or `1`. Reserves space
   *  before the children mount. */
  aspect?: string | number;
  /** Extend past the text column on wider screens. Default true. */
  bleed?: boolean;
  className?: string;
  children?: ReactNode;
};

export function Figure({
  name,
  title,
  caption,
  controls,
  aspect,
  bleed = true,
  className,
  children,
}: FigureProps) {
  const shape = useShape();
  const stageRef = useRef<HTMLDivElement>(null);
  const near = useNearViewport(stageRef);
  const reducedMotion = useReducedMotion() ?? false;
  const header = title !== undefined || controls !== undefined;

  return (
    <figure
      data-interactive={name}
      className={cn(bleed && "bleed", "space-y-2.5", className)}
    >
      <div
        className={cn(
          "relative overflow-hidden text-foreground",
          surface,
          shape.container,
        )}
      >
        {header ? (
          <div className="flex min-h-11 items-center justify-between gap-3 px-4 pt-3">
            {title !== undefined ? (
              <p className="text-sm font-medium tracking-tight">{title}</p>
            ) : (
              <span />
            )}
            {controls !== undefined ? (
              <div className="flex items-center gap-1.5">{controls}</div>
            ) : null}
          </div>
        ) : null}
        <div
          ref={stageRef}
          className={cn(
            "relative",
            aspect === undefined && !near && "min-h-40",
          )}
          style={aspectStyle(aspect)}
        >
          {near ? (
            <FigureContext
              value={{
                reducedMotion,
              }}
            >
              <motion.div
                className="h-full"
                initial={
                  reducedMotion
                    ? false
                    : {
                        opacity: 0,
                        y: 4,
                      }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={spring.slow}
              >
                {children}
              </motion.div>
            </FigureContext>
          ) : null}
        </div>
      </div>
      {caption ? (
        <figcaption className="px-1 font-mono text-[11px] leading-5 text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** The empty frame a figure occupies before its code arrives. */
export function FigureSkeleton({
  ref,
  name,
  aspect = "16 / 9",
  bleed = true,
}: {
  ref?: Ref<HTMLDivElement>;
  name?: string;
  aspect?: string | number;
  bleed?: boolean;
}) {
  const shape = useShape();
  return (
    <div
      ref={ref}
      data-interactive={name}
      aria-hidden="true"
      className={cn(bleed && "bleed", surface, shape.container)}
      style={aspectStyle(aspect)}
    />
  );
}

/** `next/dynamic` loading placeholder. */
export function FigureLoading() {
  return <FigureSkeleton />;
}
