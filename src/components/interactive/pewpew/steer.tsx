"use client";

import { steerWalk } from "@/explainers/pewpew/vendor/explainer/src/figures/basics";
import type { InteractiveFigureProps } from "../types";
import { VendoredFigure } from "./imperative-figure";

export function PewpewSteer({ name }: InteractiveFigureProps) {
  return (
    <VendoredFigure name={name} title="steerVelocity()" build={steerWalk} />
  );
}
