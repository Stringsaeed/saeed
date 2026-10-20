"use client";

import { frameWalk } from "@/explainers/pewpew/vendor/explainer/src/figures/frame";
import type { InteractiveFigureProps } from "../types";
import { VendoredFigure } from "./imperative-figure";

export function PewpewFrame({ name }: InteractiveFigureProps) {
  return (
    <VendoredFigure
      name={name}
      title="advance(), one frame at a time"
      build={frameWalk}
    />
  );
}
