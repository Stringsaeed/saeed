"use client";

import { levelRow } from "@/explainers/pewpew/vendor/explainer/src/figures/levels";
import type { InteractiveFigureProps } from "../types";
import { VendoredFigure } from "./imperative-figure";

export function PewpewLevel({ name }: InteractiveFigureProps) {
  return (
    <VendoredFigure name={name} title="A row of LEVELS" build={levelRow} />
  );
}
