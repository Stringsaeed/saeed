"use client";

import { runtimesFigure } from "@/explainers/pewpew/vendor/explainer/src/figures/threads";
import type { InteractiveFigureProps } from "../types";
import { VendoredFigure } from "./imperative-figure";

export function PewpewRuntimes({ name }: InteractiveFigureProps) {
  return (
    <VendoredFigure
      name={name}
      title="Every file, and where it runs"
      build={runtimesFigure}
    />
  );
}
