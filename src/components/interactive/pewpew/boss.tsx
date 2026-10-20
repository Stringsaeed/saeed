"use client";

import { bossFigure } from "@/explainers/pewpew/vendor/explainer/src/figures/enemies";
import type { InteractiveFigureProps } from "../types";
import { VendoredFigure } from "./imperative-figure";

export function PewpewBoss({ name }: InteractiveFigureProps) {
  return <VendoredFigure name={name} title="Boss phases" build={bossFigure} />;
}
