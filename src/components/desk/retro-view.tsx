"use client";

import {
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { playHoverSound, playSound } from "@/lib/sound";
import styles from "./desk.module.css";
import type { RetroStage, StageEvents } from "./retro-stage";
import type { ThingSpec } from "./things-models";

// A desk of things drawn by the retro stage, with the DOM around it: a
// label under whichever thing the pointer is on, and a caption line that
// says more about the one last touched. Any set of things can use it.

/** What the view needs from whatever draws the things. */
export type Stage = Pick<
  RetroStage,
  "hover" | "leave" | "grab" | "move" | "release" | "poke" | "dispose"
> & {
  /** A drag that starts on nothing does something, so the view follows it. */
  pans?: boolean;
  /** A tap that lands on nothing. */
  tap?: (clientX: number, clientY: number) => void;
};

export type StageFactory = (
  canvas: HTMLCanvasElement,
  things: readonly ThingSpec[],
  events: StageEvents,
  options: {
    pixelSize: number;
    reducedMotion: boolean;
  },
) => Stage;

export type RetroViewProps<Id extends string> = {
  things: readonly ThingSpec<Id>[];
  label: string;
  /** Loads the scene: the desk and shelf, or the office. Keeps three.js
   *  off the first paint. Must be the same function on every render. */
  load: () => Promise<StageFactory>;
  /** CSS pixels per drawn texel. */
  pixelSize?: number;
  /** What to read for a thing, in the label and the caption. */
  describe: (id: Id) => string;
  /** The caption line for the shown thing, or the resting line. */
  caption: (id: Id | null) => ReactNode;
  className?: string;
  stageClassName?: string;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function RetroView<Id extends string>({
  things,
  label,
  load,
  pixelSize = 3,
  describe,
  caption,
  className,
  stageClassName,
}: RetroViewProps<Id>) {
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const labelRefs = useRef(new Map<string, HTMLButtonElement>());
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState<Id | null>(null);
  const [active, setActive] = useState<Id | null>(null);
  const [holding, setHolding] = useState<Id | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let stage: Stage | null = null;
    load()
      .then((create) => {
        if (cancelled) return;
        stage = create(
          canvas,
          things,
          {
            onHover: (id) => setHover(id as Id | null),
            onActivate: (id) => setActive(id as Id),
            onProject: (positions) => {
              for (const [id, point] of positions) {
                const node = labelRefs.current.get(id);
                if (!node) continue;
                node.style.transform = `translate(${point.x.toFixed(1)}px, ${(point.y + 6).toFixed(1)}px)`;
              }
            },
            onReady: () => setReady(true),
            onLand: () => playSound("bookTap"),
          },
          {
            pixelSize,
            reducedMotion: reduced,
          },
        );
        stageRef.current = stage;
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      stageRef.current = null;
      stage?.dispose();
    };
  }, [
    reduced,
    things,
    load,
    pixelSize,
  ]);

  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    moved: boolean;
    thing: Id | null;
  } | null>(null);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const stage = stageRef.current;
      if (!stage) return;
      const current = drag.current;
      if (current && current.id === event.pointerId) {
        if (
          Math.abs(event.clientX - current.x) +
            Math.abs(event.clientY - current.y) >
          3
        ) {
          current.moved = true;
        }
        stage.move(event.clientX, event.clientY);
        return;
      }
      if (event.pointerType === "mouse")
        stage.hover(event.clientX, event.clientY);
    },
    [],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const stage = stageRef.current;
      if (!stage || event.button !== 0) return;
      const thing = stage.grab(event.clientX, event.clientY) as Id | null;
      drag.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        moved: false,
        thing,
      };
      if (!thing && !stage.pans) return;
      event.preventDefault();
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Fine without capture; moves over the canvas still arrive.
      }
      if (!thing) return;
      setHolding(thing);
      setActive(thing);
      playSound("select");
    },
    [],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const stage = stageRef.current;
      const current = drag.current;
      if (!stage || !current || current.id !== event.pointerId) return;
      drag.current = null;
      stage.release();
      setHolding(null);
      if (current.moved) return;
      if (current.thing) {
        stage.poke(current.thing);
        playSound("tap");
      } else if (event.type === "pointerup") {
        stage.tap?.(event.clientX, event.clientY);
      }
    },
    [],
  );

  const onPointerLeave = useCallback(() => {
    stageRef.current?.leave();
  }, []);

  const onLabelFocus = useCallback((event: { currentTarget: HTMLElement }) => {
    setActive(event.currentTarget.dataset.thing as Id);
  }, []);

  const onLabelClick = useCallback((event: { currentTarget: HTMLElement }) => {
    const id = event.currentTarget.dataset.thing as Id;
    stageRef.current?.poke(id);
    setActive(id);
    playSound("tap");
  }, []);

  const setLabelRef = useCallback((node: HTMLButtonElement | null) => {
    if (!node) return;
    labelRefs.current.set(node.dataset.thing ?? "", node);
  }, []);

  useEffect(() => {
    if (hover) playHoverSound("hover");
  }, [
    hover,
  ]);

  const shown = holding ?? hover ?? active;

  if (failed) return null;

  return (
    <section
      className={[
        styles.desk,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={label}
      data-ready={ready || undefined}
      data-hover={hover ? "" : undefined}
      data-holding={holding ? "" : undefined}
    >
      <div
        className={[
          styles.stage,
          stageClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onPointerMove={onPointerMove}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerLeave}
        />
        <ul className={styles.labels}>
          {things.map((thing) => (
            <li key={thing.id}>
              <button
                type="button"
                className={styles.label}
                ref={setLabelRef}
                data-thing={thing.id}
                data-show={shown === thing.id || undefined}
                aria-label={describe(thing.id)}
                onFocus={onLabelFocus}
                onClick={onLabelClick}
              >
                {thing.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.caption} aria-live="polite">
        {caption(shown)}
      </div>
    </section>
  );
}
