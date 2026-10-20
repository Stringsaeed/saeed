"use client";

import { runtimesFigure } from "@/explainers/pewpew/vendor/explainer/src/figures/threads";
import type { InteractiveFigureProps } from "../types";
import { VendoredFigure } from "./imperative-figure";

/** Upstream's table, inside a focusable box that scrolls sideways on narrow
 *  screens (pewpew-figure.css) instead of breaking words inside cells. */
function buildRuntimes(): HTMLElement {
  const el = runtimesFigure();
  const table = el.querySelector("table.rt");
  if (table) {
    const scroller = document.createElement("div");
    scroller.className = "rt-scroll";
    scroller.tabIndex = 0;
    scroller.setAttribute("role", "region");
    scroller.setAttribute("aria-label", "Every file, and where it runs");
    table.replaceWith(scroller);
    scroller.append(table);
  }
  return el;
}

export function PewpewRuntimes({ name }: InteractiveFigureProps) {
  return (
    <VendoredFigure
      name={name}
      title="Every file, and where it runs"
      build={buildRuntimes}
    />
  );
}
