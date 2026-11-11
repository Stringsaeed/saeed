"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { SaeedName } from "@/components/saeed-name";
import {
  blueprintDrawingSpec,
  setBlueprintEnabled,
  useBlueprint,
} from "@/lib/blueprint";

const ZONES_X = [
  "1",
  "2",
  "3",
  "4",
] as const;

const ZONES_Y = [
  "A",
  "B",
  "C",
  "D",
] as const;

/**
 * Fixed architectural sheet grid, outer drawing frame, and live vernier cursor
 * calipers. Renders nothing when blueprint mode is inactive.
 */
export function BlueprintSheetBackdrop() {
  const enabled = useBlueprint();
  const frameRef = useRef<HTMLDivElement>(null);
  const xLabelRef = useRef<HTMLSpanElement>(null);
  const yLabelRef = useRef<HTMLSpanElement>(null);
  const telemetryRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const frame = frameRef.current;
    if (!frame) return;

    let pointerX = 0;
    let pointerY = 0;
    let hasPointer = false;
    let rafId = 0;

    const paint = () => {
      rafId = 0;
      if (hasPointer) {
        frame.style.setProperty("--bp-cx", `${pointerX}px`);
        frame.style.setProperty("--bp-cy", `${pointerY}px`);
        frame.dataset.cursor = "active";
        if (xLabelRef.current) {
          xLabelRef.current.textContent = `X:${String(pointerX).padStart(4, "0")}`;
        }
        if (yLabelRef.current) {
          yLabelRef.current.textContent = `Y:${String(pointerY).padStart(4, "0")}`;
        }
      }
      if (telemetryRef.current) {
        const scrollY = Math.round(window.scrollY);
        const px = hasPointer ? String(pointerX).padStart(4, "0") : "----";
        const py = hasPointer ? String(pointerY).padStart(4, "0") : "----";
        telemetryRef.current.textContent = `POS ${px},${py} · SCR ${String(scrollY).padStart(4, "0")}PX`;
      }
    };

    const schedule = () => {
      if (!rafId) rafId = window.requestAnimationFrame(paint);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      hasPointer = true;
      pointerX = Math.round(event.clientX);
      pointerY = Math.round(event.clientY);
      schedule();
    };

    const handleScroll = () => schedule();

    paint();
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [
    enabled,
  ]);

  if (!enabled) return null;

  return (
    <div
      ref={frameRef}
      aria-hidden="true"
      className="blueprint-sheet pointer-events-none fixed inset-0 z-0 select-none print:hidden forced-colors:hidden"
    >
      {/* Engineering millimeter grid + 120px major subdivisions */}
      <div className="blueprint-grid absolute inset-0" />

      {/* Outer CAD drawing border, ruler graduations, and zone indices */}
      <div className="blueprint-frame fixed inset-2 z-20 hidden sm:block md:inset-3">
        {/* Corner registration crosshairs */}
        <span className="blueprint-corner -top-1.5 -left-1.5">+</span>
        <span className="blueprint-corner -top-1.5 -right-1.5">+</span>
        <span className="blueprint-corner -bottom-1.5 -left-1.5">+</span>
        <span className="blueprint-corner -right-1.5 -bottom-1.5">+</span>

        {/* Graduated top & left vernier rulers */}
        <div className="blueprint-ruler-x hidden md:block" />
        <div className="blueprint-ruler-y hidden md:block" />

        {/* Live cursor vernier hairlines along the rulers */}
        <div className="blueprint-caliper-x hidden md:flex">
          <span ref={xLabelRef} className="blueprint-caliper-tag">
            X:0000
          </span>
        </div>
        <div className="blueprint-caliper-y hidden md:flex">
          <span ref={yLabelRef} className="blueprint-caliper-tag">
            Y:0000
          </span>
        </div>

        {/* Sheet zone markers (1–4 across, A–D down) */}
        <div className="absolute inset-x-16 top-1 hidden justify-around font-mono text-[10px] tracking-widest text-muted-foreground/55 lg:flex">
          {ZONES_X.map((zone) => (
            <span key={zone}>{zone}</span>
          ))}
        </div>
        <div className="absolute inset-y-16 right-1.5 hidden flex-col justify-around font-mono text-[10px] text-muted-foreground/55 lg:flex">
          {ZONES_Y.map((zone) => (
            <span key={zone}>{zone}</span>
          ))}
        </div>

        {/* Live coordinate telemetry stamp in bottom-left margin */}
        <span
          ref={telemetryRef}
          className="absolute bottom-1.5 left-3 hidden font-mono text-[10px] tracking-wider text-muted-foreground/75 tabular-nums lg:inline-block"
        >
          POS ----,---- · SCR 0000PX
        </span>
      </div>
    </div>
  );
}

/**
 * Architectural CAD Title Block stamped above the footer when blueprint mode
 * is active, complete with live viewport dimensions and signature approval.
 */
export function BlueprintTitleBlock() {
  const enabled = useBlueprint();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [viewport, setViewport] = useState<string>("--- × ---");

  useEffect(() => {
    if (!enabled) return;
    const update = () => {
      setViewport(`${window.innerWidth} × ${window.innerHeight} PX`);
    };
    update();
    window.addEventListener("resize", update, {
      passive: true,
    });
    return () => window.removeEventListener("resize", update);
  }, [
    enabled,
  ]);

  const handleExit = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setBlueprintEnabled(false, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }, []);

  if (!enabled) return null;

  const spec = blueprintDrawingSpec(pathname);
  const substrate =
    resolvedTheme === "light" ? "VELLUM // COBALT" : "CYANOTYPE // PRUSSIAN";

  return (
    <aside
      aria-label="Blueprint title block"
      className="blueprint-title-block mb-6 font-mono text-[11px] leading-4"
    >
      <div className="grid grid-cols-2 border-b border-[var(--bp-line)] sm:grid-cols-[1.2fr_1.5fr_0.7fr]">
        <div className="border-r border-b border-[var(--bp-line)] px-3 py-2 sm:border-b-0">
          <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
            Project
          </div>
          <div className="mt-0.5 font-medium text-foreground">
            {"SAEED.GURU // PORTFOLIO"}
          </div>
        </div>
        <div className="border-b border-[var(--bp-line)] px-3 py-2 sm:border-r sm:border-b-0">
          <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
            Drawing Title
          </div>
          <div className="mt-0.5 truncate font-medium text-foreground">
            {spec.title}
          </div>
        </div>
        <div className="col-span-2 flex items-center justify-between px-3 py-2 sm:col-span-1 sm:block">
          <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
            Dwg No. / Sheet
          </div>
          <div className="mt-0.5 font-medium text-foreground tabular-nums">
            {spec.code} · {spec.sheet}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto_auto]">
        <div className="border-r border-b border-[var(--bp-line)] px-3 py-2 sm:border-b-0">
          <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
            Substrate
          </div>
          <div className="mt-0.5 text-foreground">{substrate}</div>
        </div>
        <div className="border-b border-[var(--bp-line)] px-3 py-2 sm:border-r sm:border-b-0">
          <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
            Scale / Viewport
          </div>
          <div className="mt-0.5 text-foreground tabular-nums">
            1:1 · {viewport}
          </div>
        </div>
        <div className="flex items-center border-r border-[var(--bp-line)] px-3 py-2">
          <button
            type="button"
            onClick={handleExit}
            data-analytics-event="Blueprint Toggled"
            data-analytics-label="Off"
            data-analytics-location="Title Block"
            data-sound-hover="hover"
            className="cursor-pointer border border-dashed border-[var(--bp-line)] px-2 py-1 text-[10px] tracking-wider text-foreground uppercase transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            [B] Exit Blueprint
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-1.5">
          <span className="text-[10px] tracking-wider text-muted-foreground uppercase">
            Approved
          </span>
          <SaeedName className="text-2xl text-foreground" />
        </div>
      </div>
    </aside>
  );
}
