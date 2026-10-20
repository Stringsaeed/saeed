"use client";

import { trackWalk } from "@/explainers/pewpew/vendor/explainer/src/figures/levels";
import type { InteractiveFigureProps } from "../types";
import { VendoredFigure } from "./imperative-figure";

export function PewpewTrack({ name }: InteractiveFigureProps) {
  return (
    <VendoredFigure name={name} title="compileTrack()" build={trackWalk} />
  );
}
