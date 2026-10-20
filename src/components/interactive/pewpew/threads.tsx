"use client";

import { threadsFigure } from "@/explainers/pewpew/vendor/explainer/src/figures/threads";
import type { InteractiveFigureProps } from "../types";
import { VendoredFigure } from "./imperative-figure";

export function PewpewThreads({ name }: InteractiveFigureProps) {
  return (
    <VendoredFigure
      name={name}
      title="Where each part runs"
      build={threadsFigure}
    />
  );
}
