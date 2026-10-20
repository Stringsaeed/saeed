"use client";

import { flowFigure } from "@/explainers/pewpew/vendor/explainer/src/figures/ui";
import type { InteractiveFigureProps } from "../types";
import { VendoredFigure } from "./imperative-figure";

export function PewpewFlow({ name }: InteractiveFigureProps) {
  return (
    <VendoredFigure
      name={name}
      title="reduce(screen, action, save)"
      build={flowFigure}
    />
  );
}
