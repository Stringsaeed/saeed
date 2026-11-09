"use client";

import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { CLAUSES } from "@/components/things-copy";
import { playHoverSound, playSound } from "@/lib/sound";
import styles from "./desk.module.css";
import type { RetroStage } from "./retro-stage";
import { THINGS, type ThingId } from "./things-models";

// Things I keep around, as objects on a desk. Hover to read what one is,
// pick it up and drop it, tap it to make it hop. The sentence about each
// one comes from the same copy the sticker line used.

const CAPTIONS = new Map<ThingId, string>(
  CLAUSES.map((clause) => {
    const rest = clause.rest
      .map((token) => (typeof token === "string" ? token : token.word))
      .join("");
    const sentence = `${clause.lead}${rest}`.replace(/[,.]\s*$/, "");
    return [
      clause.id,
      `${sentence[0].toUpperCase()}${sentence.slice(1)}.`,
    ];
  }),
);

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

export function Desk() {
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<RetroStage | null>(null);
  const labelRefs = useRef(new Map<ThingId, HTMLButtonElement>());
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState<ThingId | null>(null);
  const [active, setActive] = useState<ThingId | null>(null);
  const [holding, setHolding] = useState<ThingId | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let stage: RetroStage | null = null;
    import("./retro-stage")
      .then(({ createRetroStage }) => {
        if (cancelled) return;
        stage = createRetroStage(
          canvas,
          THINGS,
          {
            onHover: setHover,
            onActivate: setActive,
            onProject: (positions) => {
              for (const [id, point] of positions) {
                const label = labelRefs.current.get(id);
                if (!label) continue;
                label.style.transform = `translate(${point.x.toFixed(1)}px, ${(point.y + 6).toFixed(1)}px)`;
              }
            },
            onReady: () => setReady(true),
          },
          {
            pixelSize: 3,
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
  ]);

  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    moved: boolean;
    thing: ThingId | null;
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
      const thing = stage.grab(event.clientX, event.clientY);
      drag.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        moved: false,
        thing,
      };
      if (!thing) return;
      event.preventDefault();
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Fine without capture; moves over the canvas still arrive.
      }
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
      if (current.thing && !current.moved) {
        stage.poke(current.thing);
        playSound("tap");
      }
    },
    [],
  );

  const onPointerLeave = useCallback(() => {
    stageRef.current?.leave();
  }, []);

  useEffect(() => {
    if (hover) playHoverSound("hover");
  }, [
    hover,
  ]);

  const shown = holding ?? hover ?? active;
  const shownThing = THINGS.find((thing) => thing.id === shown);

  if (failed) return null;

  return (
    <section
      className={styles.desk}
      aria-label="Things I keep around"
      data-ready={ready || undefined}
      data-hover={hover ? "" : undefined}
      data-holding={holding ? "" : undefined}
    >
      <div className={styles.stage}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onPointerMove={onPointerMove}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerLeave}
        />
        <div className={styles.edge} aria-hidden="true" />
        <ul className={styles.labels}>
          {THINGS.map((thing) => (
            <li key={thing.id}>
              <button
                type="button"
                className={styles.label}
                ref={(node) => {
                  if (node) labelRefs.current.set(thing.id, node);
                  else labelRefs.current.delete(thing.id);
                }}
                data-show={shown === thing.id || undefined}
                aria-label={`${thing.name}. ${CAPTIONS.get(thing.id) ?? ""}`}
                onFocus={() => setActive(thing.id)}
                onClick={() => {
                  stageRef.current?.poke(thing.id);
                  playSound("tap");
                }}
              >
                {thing.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className={styles.caption} aria-live="polite">
        {shownThing ? (
          <>
            <strong>{shownThing.name}</strong>
            <span>{CAPTIONS.get(shownThing.id)}</span>
          </>
        ) : (
          <span>Things I keep around. Pick one up.</span>
        )}
      </p>
    </section>
  );
}
