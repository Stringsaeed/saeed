"use client";

import { collideFigure } from "@/explainers/pewpew/vendor/explainer/src/figures/collide";
import type { InteractiveFigureProps } from "../types";
import { VendoredFigure } from "./imperative-figure";

export function PewpewCollide({ name }: InteractiveFigureProps) {
  return (
    <VendoredFigure
      name={name}
      title="collide(), one body at a time"
      build={collideFigure}
    />
  );
}
