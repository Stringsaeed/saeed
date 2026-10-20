"use client";

import { botFigure } from "@/explainers/pewpew/vendor/explainer/src/figures/proof";
import type { InteractiveFigureProps } from "../types";
import { VendoredFigure } from "./imperative-figure";

export function PewpewBot({ name }: InteractiveFigureProps) {
  return (
    <VendoredFigure
      name={name}
      title="greedyBot, a whole level"
      build={botFigure}
    />
  );
}
