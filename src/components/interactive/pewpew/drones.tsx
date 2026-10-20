"use client";

import { droneWalk } from "@/explainers/pewpew/vendor/explainer/src/figures/enemies";
import type { InteractiveFigureProps } from "../types";
import { VendoredFigure } from "./imperative-figure";

export function PewpewDrones({ name }: InteractiveFigureProps) {
  return <VendoredFigure name={name} title="DRONE_MOVES" build={droneWalk} />;
}
