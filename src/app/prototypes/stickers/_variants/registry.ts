import type { ComponentType } from "react";
import { StickerLongTake } from "@/components/sticker-long-take";
import { StickerPaperweights } from "@/components/sticker-paperweights";
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

// Picker order. Paperweights and Long Take are the desks the site A/B tests;
// Mobile is kept to revisit later.
export const VARIANTS: PrototypeVariant[] = [
  variant("Long Take", "Time: one walk through a life", {
    default: StickerLongTake,
    pickerPosition: "bottom",
  }),
  variant("Paperweights", "Page: stickers holding down chapters", {
    default: StickerPaperweights,
    pickerPosition: "bottom",
  }),
  variant("Mobile", "Balance: a hanging mobile with weight", mobile),
];
