"use client";
"use no memo";

import "./pewpew-figure.css";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { setCanvasFontFamily } from "@/explainers/pewpew/shims/canvas";
import { FigureScope } from "@/explainers/pewpew/shims/frames";
import { Figure, FigurePlayButton } from "../figure";
import type { InteractiveFigureProps } from "../types";
import { useFigure } from "../use-figure";
import { reportFigure } from "./dev-stats";

// "use no memo": the vendored figures own their DOM and mutate it (and the
// sim) in place; the React Compiler must not memoize around them.

export type Teardown = () => void;

/** Builds a figure into `root`. Runs once per island, inside the figure's
 *  timer scope, so every requestAnimationFrame / setInterval it starts
 *  (through shims/frames.ts) pauses with the figure and dies with it. */
export type MountFigure = (root: HTMLElement) => Teardown | undefined;

/** Events that run figure code. Marking them makes timers a handler starts
 *  (the walk's ▶ Play) belong to this figure's scope. */
const FIGURE_EVENTS = [
  "click",
  "input",
  "change",
  "keydown",
  "pointerdown",
  "pointermove",
  "pointerup",
] as const;

/** Events that count as the reader asking the figure to move: under
 *  reduced motion a figure starts paused, and the first one starts it. */
const CONSENT_EVENTS = [
  "click",
  "input",
] as const;

/**
 * A React island around an imperative figure. Mounts once the figure is
 * active (playing and on screen), or straight away if the reader has it
 * paused, so a paused figure still shows its first state. While the figure
 * is not active its timers are held; on unmount they are cancelled and the
 * teardown runs. Its height follows its content.
 */
export function ImperativeFigure({
  name,
  mount,
}: {
  name: string;
  mount: MountFigure;
}) {
  const { active, playing, setPlaying } = useFigure();
  const rootRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<FigureScope | null>(null);
  // A latch: once mounted, the figure stays mounted while it scrolls away.
  const [mounted, setMounted] = useState(false);
  if (!mounted && (active || !playing)) setMounted(true);

  const runMount = useEffectEvent((root: HTMLElement) => mount(root));
  const isActive = useEffectEvent(() => active);
  const startOnConsent = useEffectEvent(() => {
    if (!playing) setPlaying(true);
  });
  const pause = useEffectEvent(() => setPlaying(false));

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !mounted) return;
    // Canvas labels use the site's mono family; next/font renames it, so
    // read the resolved family once instead of naming it.
    setCanvasFontFamily(
      getComputedStyle(root).getPropertyValue("--pp-mono") ||
        getComputedStyle(root).fontFamily,
    );
    const scope = new FigureScope(name);
    scopeRef.current = scope;
    scope.onPauseRequest = () => pause();
    const consent = () => startOnConsent();
    for (const type of FIGURE_EVENTS)
      root.addEventListener(type, scope.enterOnEvent, {
        capture: true,
      });
    for (const type of CONSENT_EVENTS)
      root.addEventListener(type, consent, {
        capture: true,
      });

    let teardown: Teardown | undefined;
    try {
      teardown = scope.run(() => runMount(root));
    } catch (error) {
      // As upstream's main.ts does: one broken figure must not take the
      // page down with it.
      console.error(error);
      const message = document.createElement("p");
      message.className = "pewpew-error";
      message.textContent = `Figure "${name}" failed to load: ${(error as Error).message}`;
      root.replaceChildren(message);
    }
    scope.setActive(isActive());

    // Dev only: refresh the counters a few times a second, so a check can
    // see whether runs still climb while the figure is off screen.
    let report: number | undefined;
    if (process.env.NODE_ENV !== "production") {
      const publish = () =>
        reportFigure(name, {
          mounted: true,
          active: scope.active,
          runs: scope.runs,
          lastRunAt: scope.lastRunAt,
        });
      publish();
      report = window.setInterval(publish, 250);
    }

    return () => {
      window.clearInterval(report);
      scope.dispose();
      for (const type of FIGURE_EVENTS)
        root.removeEventListener(type, scope.enterOnEvent, {
          capture: true,
        });
      for (const type of CONSENT_EVENTS)
        root.removeEventListener(type, consent, {
          capture: true,
        });
      teardown?.();
      root.replaceChildren();
      scopeRef.current = null;
      if (process.env.NODE_ENV !== "production") reportFigure(name, null);
    };
  }, [
    name,
    mounted,
  ]);

  useEffect(() => {
    scopeRef.current?.setActive(active);
  }, [
    active,
  ]);

  return <div ref={rootRef} className="pewpew-root" />;
}

export type VendoredFigureProps = InteractiveFigureProps & {
  title: ReactNode;
  /** One of the explainer's figure builders, e.g. `poolFigure`. */
  build: () => HTMLElement;
  /** Show the site's play/pause button: for figures that animate on their
   *  own (the pool) rather than through a walk's ▶ Play. */
  playButton?: boolean;
};

/**
 * A vendored explainer figure in the site's frame. Our header shows the
 * figure's label as the title and adopts its progress dots; the explainer's
 * own label row and caption are hidden by pewpew-figure.css (the caption
 * comes from Sanity). Walks keep their own playback bar, so they get no
 * FigurePlayButton; either way, off screen is handled by the timer scope.
 */
export function VendoredFigure({
  name,
  title,
  build,
  playButton = false,
}: VendoredFigureProps) {
  const dotsRef = useRef<HTMLSpanElement>(null);

  const mount = useCallback<MountFigure>(
    (root) => {
      const el = build();
      root.append(el);
      const dots = el.querySelector(":scope > .viz-head > .dots");
      if (dots && dotsRef.current) dotsRef.current.append(dots);
      return () => dots?.remove();
    },
    [
      build,
    ],
  );

  return (
    <Figure
      name={name}
      title={title}
      controls={
        <>
          <span ref={dotsRef} aria-hidden="true" className="pewpew-dots" />
          {playButton ? <FigurePlayButton /> : null}
        </>
      }
    >
      <ImperativeFigure name={name} mount={mount} />
    </Figure>
  );
}
