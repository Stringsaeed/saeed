import type { ComponentType } from "react";
import { StickerLongTake } from "@/components/sticker-long-take";
import { StickerPaperweights } from "@/components/sticker-paperweights";
import * as mobile from "./mobile";
import * as questions from "./questions";
import * as rebus from "./rebus";
import type { StickerDisplayProps, VariantKind, VariantModule } from "./types";

export type PrototypeVariant = {
  name: string;
  axis: string;
  kind: VariantKind;
  // Desk variants get onClose; inline and standalone variants take no props.
  Component: ComponentType<StickerDisplayProps> | ComponentType;
  pickerPosition: "top" | "bottom";
};

const variant = (
  name: string,
  axis: string,
  module: VariantModule,
): PrototypeVariant => ({
  name,
  axis,
  kind: module.kind ?? "desk",
  Component: module.default,
  pickerPosition: module.pickerPosition,
});

// Picker order. Paperweights and Long Take are the desks the site A/B tests;
// Mobile is kept to revisit later. New directions go after them.
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
  variant("Questions", "Ask: questions lead, objects answer", questions),
  variant("Rebus", "Copy: stickers stuck over the nouns", rebus),
];
