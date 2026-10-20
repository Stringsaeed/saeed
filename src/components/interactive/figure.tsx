"use client";

import { RiPauseLine, RiPlayLine } from "@remixicon/react";
import { motion, useReducedMotion } from "framer-motion";
import {
  type CSSProperties,
  type ReactNode,
  type Ref,
  useCallback,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { warnOnceInDev } from "@/lib/dev-warn";
import { useShape } from "@/lib/shape-context";
import { spring } from "@/lib/springs";
import { cn } from "@/lib/utils";
import {
  figcaptionClass,
  figureClass,
  headerClass,
  surfaceClass,
} from "./frame-classes";
import {
  FigureContext,
  useFigure,
  useFigureHost,
  useNearViewport,
  useOnScreen,
} from "./use-figure";

// The frame every interactive figure sits in: the site's outlined surface,
// an optional title/controls row, a stage, and a mono caption. In a post,
// the server renders <figure> and the caption and InteractiveBlock hosts
// this component, so Figure renders only the surface at the size the
// registry reserved. Standalone (no host) it renders the whole figure.
// The frame itself is not focusable; children own focus.

function aspectStyle(
  aspect: string | number | undefined,
): CSSProperties | undefined {
  return aspect === undefined
    ? undefined
    : {
        aspectRatio: aspect,
      };
}

export type FigureProps = {
  /** Registry name for `data-interactive` (standalone only; a hosted figure
   *  gets it from the post). */
  name?: string;
  title?: ReactNode;
  /** Standalone only; in a post the caption comes from Sanity and is
   *  rendered on the server. */
  caption?: ReactNode;
  /** Right side of the title row: FigurePlayButton, reset, step… */
  controls?: ReactNode;
  /** CSS aspect-ratio for the stage. In a post the registry's value wins. */
  aspect?: string | number;
  /** Extend past the text column on wider screens (standalone only). */
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
  const host = useFigureHost();
  const shape = useShape();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const near = useNearViewport(surfaceRef);
  const onScreen = useOnScreen(surfaceRef);
  const reducedMotion = useReducedMotion() ?? false;
  const [choice, setPlaying] = useState<boolean | null>(null);
  const playing = choice ?? !reducedMotion;
  const header = title !== undefined || controls !== undefined;
  const stageAspect = host?.aspect ?? aspect;

  if (host && host.header !== header)
    warnOnceInDev(
      `figure-header:${host.name}`,
      `[Figure] "${host.name}" ${header ? "renders" : "has no"} a header but the registry says header: ${host.header}; the page will shift when it loads.`,
    );

  const surface = (
    <FigureContext
      value={{
        reducedMotion,
        playing,
        setPlaying,
        active: playing && onScreen,
      }}
    >
      <div ref={surfaceRef} className={cn(surfaceClass, shape.container)}>
        {header ? (
          <div className={headerClass}>
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
          data-figure-stage=""
          className={cn(
            "relative",
            stageAspect === undefined && !near && "min-h-40",
          )}
          style={aspectStyle(stageAspect)}
        >
          {host || near ? (
            // Opacity only: a transform would offset getBoundingClientRect
            // while it settles and skew pointer maths on canvases.
            <motion.div
              className="h-full"
              initial={
                reducedMotion
                  ? false
                  : {
                      opacity: 0,
                    }
              }
              animate={{
                opacity: 1,
              }}
              transition={spring.slow}
            >
              {children}
            </motion.div>
          ) : null}
        </div>
      </div>
    </FigureContext>
  );

  if (host) return surface;

  return (
    <figure
      data-interactive={name}
      className={cn(bleed && "bleed", figureClass, className)}
    >
      {surface}
      {caption ? (
        <figcaption className={figcaptionClass}>{caption}</figcaption>
      ) : null}
    </figure>
  );
}

/** The surface a hosted figure occupies before its code arrives: same
 *  header height and stage aspect as the real one, taken from the host. */
export function FigureSkeleton({ ref }: { ref?: Ref<HTMLDivElement> }) {
  const host = useFigureHost();
  const shape = useShape();
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(surfaceClass, shape.container)}
    >
      {host?.header ? <div className={headerClass} /> : null}
      <div style={aspectStyle(host?.aspect ?? "16 / 9")} />
    </div>
  );
}

/** `next/dynamic` loading placeholder; rendered inside the host context. */
export function FigureLoading() {
  return <FigureSkeleton />;
}

/** Standard play/pause toggle for a figure's `controls` slot. Any figure
 *  that moves for more than five seconds needs one (WCAG 2.2.2). */
export function FigurePlayButton() {
  const { playing, setPlaying } = useFigure();
  const toggle = useCallback(
    () => setPlaying(!playing),
    [
      playing,
      setPlaying,
    ],
  );
  const Icon = playing ? RiPauseLine : RiPlayLine;

  return (
    <Button
      type="button"
      variant="tertiary"
      size="icon-compact"
      aria-label={playing ? "Pause" : "Play"}
      title={playing ? "Pause" : "Play"}
      data-sound="tap"
      onClick={toggle}
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}
