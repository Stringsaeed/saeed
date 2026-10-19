import type { ComponentType } from "react";
import { StickerPaperweights } from "@/components/sticker-paperweights";
import * as longTake from "./long-take";
import * as mobile from "./mobile";
import type { StickerDisplayProps } from "./types";

export type PrototypeVariant = {
  name: string;
  axis: string;
  Component: ComponentType<StickerDisplayProps>;
  pickerPosition: "top" | "bottom";
};

const variant = (
  name: string,
  axis: string,
  module: {
    default: ComponentType<StickerDisplayProps>;
    pickerPosition: "top" | "bottom";
  },
): PrototypeVariant => ({
  name,
  axis,
  Component: module.default,
  pickerPosition: module.pickerPosition,
});

// Picker order. Paperweights is the shipped desk; the other two are kept to
// revisit later.
export const VARIANTS: PrototypeVariant[] = [
  variant("Long Take", "Time: one walk through a life", longTake),
  variant("Paperweights", "Page: stickers holding down chapters", {
    default: StickerPaperweights,
    pickerPosition: "bottom",
  }),
  variant("Mobile", "Balance: a hanging mobile with weight", mobile),
];
