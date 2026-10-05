"use client";

import { Scan } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";

type Boundary = {
  id: number;
  label: string;
  kind: "sticker" | "area";
  x: number;
  y: number;
  width: number;
  height: number;
};

const TARGETS =
  "[data-sticker], [data-sticker-id], [data-raised-sticker], [data-sticker-protected], .site-layout header, .site-layout main, .site-layout footer";

function DebugBoundaries({ id }: { id: string }) {
  const [boundaries, setBoundaries] = useState<Boundary[]>([]);

  useEffect(() => {
    let frame = 0;
    let previous = "";
    const ids = new WeakMap<HTMLElement, number>();
    let nextId = 0;

    function measure() {
      const next: Boundary[] = [];
      for (const element of document.querySelectorAll<HTMLElement>(TARGETS)) {
        const rect = element.getBoundingClientRect();
        if (
          rect.width === 0 ||
          rect.height === 0 ||
          rect.bottom < 0 ||
          rect.top > window.innerHeight ||
          getComputedStyle(element).opacity === "0"
        ) {
          continue;
        }
        const sticker =
          element.dataset.sticker ??
          element.dataset.stickerId ??
          (element.hasAttribute("data-raised-sticker")
            ? "Raised sticker"
            : null);
        let id = ids.get(element);
        if (id === undefined) {
          id = nextId++;
          ids.set(element, id);
        }
        next.push({
          id,
          label:
            sticker ??
            (element.hasAttribute("data-sticker-protected")
              ? "Content area"
              : element.tagName.toLowerCase()),
          kind: sticker === null ? "area" : "sticker",
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
      const snapshot = JSON.stringify(next);
      if (snapshot !== previous) {
        previous = snapshot;
        setBoundaries(next);
      }
      frame = requestAnimationFrame(measure);
    }

    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div id={id} aria-hidden="true" className="layout-debug-overlay">
      {boundaries.map((boundary) => (
        <div
          key={boundary.id}
          className="layout-debug-boundary"
          data-debug-kind={boundary.kind}
          style={{
            left: boundary.x,
            top: boundary.y,
            width: boundary.width,
            height: boundary.height,
          }}
        >
          <span
            className="layout-debug-label"
            style={{
              left: Math.max(0, -boundary.x),
              top:
                Math.max(0, -boundary.y) +
                (boundary.label === "Content area" ? 24 : 0),
              maxWidth: `calc(100vw - ${Math.max(0, boundary.x)}px)`,
            }}
          >
            {boundary.label} · {boundary.width} × {boundary.height} px
          </span>
        </div>
      ))}
    </div>
  );
}

export function LayoutDebug() {
  const [enabled, setEnabled] = useState(false);
  const overlayId = useId();
  const toggle = useCallback(() => setEnabled((current) => !current), []);

  return (
    <>
      {enabled ? <DebugBoundaries id={overlayId} /> : null}
      <div className="layout-debug-controls">
        {enabled ? (
          <p className="layout-debug-legend">
            <span>Stickers</span> <span>Page areas</span>
          </p>
        ) : null}
        <button
          type="button"
          aria-pressed={enabled}
          aria-controls={enabled ? overlayId : undefined}
          className="layout-debug-toggle"
          onClick={toggle}
        >
          <Scan size={16} aria-hidden="true" />
          Debug mode
          <span>{enabled ? "On" : "Off"}</span>
        </button>
      </div>
    </>
  );
}
