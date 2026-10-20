"use client";

import { proofFigure } from "@/explainers/pewpew/vendor/explainer/src/figures/proof";
import type { InteractiveFigureProps } from "../types";
import { VendoredFigure } from "./imperative-figure";

export function PewpewProof({ name }: InteractiveFigureProps) {
  return (
    <VendoredFigure
      name={name}
      title="Same inputs, same world"
      build={proofFigure}
    />
  );
}
