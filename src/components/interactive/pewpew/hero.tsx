"use client";
"use no memo";

// The opening figure: the game's real shell loop (createLoop, resetRun,
// advance) with greedyBot flying level 1, drawn by the explainer's 2D
// world reader. Upstream's hero draws with the game's WebGPU renderer and
// plays sound; neither is vendored, so this is the "2D sim view" of it.
// "use no memo": the loop and world are mutated in place every frame.

import { useEffect, useRef } from "react";
import { setCanvasFontFamily } from "@/explainers/pewpew/shims/canvas";
import { drawWorld } from "@/explainers/pewpew/vendor/explainer/src/world2d";
import { greedyBot } from "@/explainers/pewpew/vendor/src/bot";
import type { LevelNumber } from "@/explainers/pewpew/vendor/src/levels";
import {
  advance,
  createLoop,
  type Loop,
  resetRun,
  type Sinks,
  setPlaying,
} from "@/explainers/pewpew/vendor/src/shell/loop";
import { hudOf, step } from "@/explainers/pewpew/vendor/src/sim";
import { Figure, FigurePlayButton } from "../figure";
import type { InteractiveFigureProps } from "../types";
import { useFigure, useFigureLoop } from "../use-figure";
import { reportFigure } from "./dev-stats";

const LEVEL: LevelNumber = 1;
/** World units visible top to bottom, as in upstream's 300×460 hero at 26 px per unit. */
const VIEW_HEIGHT = 17.7;
/** World units across: the 9-unit track plus a margin. */
const VIEW_WIDTH = 11.5;
/** Steps flown before the first draw, so a paused figure shows a level in progress. */
const PRE_ROLL = 150;

type Hero = {
  loop: Loop;
  attempt: number;
  sinks: Sinks;
  ctx: CanvasRenderingContext2D | null;
  scale: number;
  runs: number;
  lastRunAt: number | null;
};

function startRun(hero: Hero) {
  hero.attempt += 1;
  resetRun(hero.loop, {
    level: LEVEL,
    attempt: hero.attempt,
  });
  setPlaying(hero.loop, true);
}

function draw(hero: Hero) {
  const world = hero.loop.world;
  if (hero.ctx && world)
    drawWorld(hero.ctx, world, {
      scale: hero.scale,
      rocketAt: 0.8,
      target: hero.loop.input.targetX,
    });
}

function hudText(next: {
  score: number;
  lives: number;
  progress: number;
  shield: boolean;
  rapid: boolean;
}) {
  const lives =
    "▲".repeat(next.lives) + "·".repeat(Math.max(0, 3 - next.lives));
  return `score ${String(next.score).padStart(5)}  ${lives}  ${String(next.progress).padStart(3)}%${next.shield ? "  shield" : ""}${next.rapid ? "  rapid" : ""}`;
}

function HeroStage({ name }: { name: string }) {
  const { active } = useFigure();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLParagraphElement>(null);
  const heroRef = useRef<Hero | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // drawWorld labels in the site's mono family (next/font renames it).
    if (hudRef.current)
      setCanvasFontFamily(getComputedStyle(hudRef.current).fontFamily);
    const loop = createLoop();
    loop.auto = true;
    const hero: Hero = {
      loop,
      attempt: 0,
      ctx: canvas.getContext("2d"),
      scale: 20,
      runs: 0,
      lastRunAt: null,
      sinks: {
        render() {
          draw(hero);
        },
        audio() {},
        ended(ev) {
          // Loop the level: a win or a loss starts the next attempt.
          if (ev.e === "won" || ev.e === "lost") startRun(hero);
        },
        hud(next) {
          if (hudRef.current) hudRef.current.textContent = hudText(next);
        },
      },
    };
    heroRef.current = hero;
    startRun(hero);
    const world = loop.world;
    if (world) {
      for (let k = 0; k < PRE_ROLL; k++) step(world, greedyBot(world), []);
      if (hudRef.current)
        hudRef.current.textContent = hudText(hudOf(world, null));
    }

    // Size the backing store to the stage. drawWorld reads the CSS size
    // back as width / 2 on any high-density screen, so match that ratio.
    const resize = () => {
      const ratio = window.devicePixelRatio > 1 ? 2 : 1;
      const { width, height } = canvas.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      hero.ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
      hero.scale = Math.min(height / VIEW_HEIGHT, width / VIEW_WIDTH);
      draw(hero);
    };
    resize();
    // A paused hero draws once; redraw when the web font arrives so its
    // labels are not left in the fallback face.
    document.fonts.ready.then(() => {
      if (heroRef.current === hero) draw(hero);
    });
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      heroRef.current = null;
      reportFigure(name, null);
    };
  }, [
    name,
  ]);

  useFigureLoop(({ dt, time }) => {
    const hero = heroRef.current;
    if (!hero) return;
    // First frame after a (re)start: no time has passed for the sim.
    if (dt === 0) hero.loop.last = time;
    advance(hero.loop, time, hero.sinks);
    hero.runs += 1;
    hero.lastRunAt = performance.now();
  });

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const report = () => {
      const hero = heroRef.current;
      if (hero)
        reportFigure(name, {
          mounted: true,
          active,
          runs: hero.runs,
          lastRunAt: hero.lastRunAt,
        });
    };
    report();
    const id = window.setInterval(report, 250);
    return () => window.clearInterval(id);
  }, [
    active,
    name,
  ]);

  return (
    <div className="relative h-full bg-[#05060d]">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="greedyBot flying level 1 of PewPew, seen from above"
        className="block size-full"
      />
      <p
        ref={hudRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-3 right-4 font-mono text-[11px] whitespace-pre text-[#d7dbea]/80 tabular-nums"
      />
    </div>
  );
}

export function PewpewHero({ name }: InteractiveFigureProps) {
  return (
    <Figure
      name={name}
      title="Level 1, flown by greedyBot"
      controls={<FigurePlayButton />}
    >
      <HeroStage name={name} />
    </Figure>
  );
}
