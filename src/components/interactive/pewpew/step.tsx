"use client";

import { stepWalk } from "@/explainers/pewpew/vendor/explainer/src/figures/stepwalk";
import type { InteractiveFigureProps } from "../types";
import { VendoredFigure } from "./imperative-figure";

export function PewpewStep({ name }: InteractiveFigureProps) {
  return (
    <VendoredFigure
      name={name}
      title="step(), one stage at a time"
      build={stepWalk}
    />
  );
}
