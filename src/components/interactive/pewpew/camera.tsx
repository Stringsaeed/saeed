"use client";

import { cameraFigure } from "@/explainers/pewpew/vendor/explainer/src/figures/ui";
import type { InteractiveFigureProps } from "../types";
import { VendoredFigure } from "./imperative-figure";

export function PewpewCamera({ name }: InteractiveFigureProps) {
  return (
    <VendoredFigure name={name} title="writeCamera()" build={cameraFigure} />
  );
}
