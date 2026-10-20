"use client";

import { poolFigure } from "@/explainers/pewpew/vendor/explainer/src/figures/basics";
import type { InteractiveFigureProps } from "../types";
import { VendoredFigure } from "./imperative-figure";

export function PewpewPool({ name }: InteractiveFigureProps) {
  return (
    <VendoredFigure
      name={name}
      title="World.bodies: one array per field"
      build={poolFigure}
      playButton
    />
  );
}
