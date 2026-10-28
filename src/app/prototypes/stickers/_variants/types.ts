import type { ComponentType } from "react";

// How a variant sits on the page. The harness hosts all three:
// - desk: a full-screen modal the corner pile opens (the shipped shape).
// - inline: a section inside the home column, no pile, always mounted.
// - standalone: owns its own entry point (a corner, a footer chip...) and
//   whatever it opens; mounted outside the column like the site's pile.
export type VariantKind = "desk" | "inline" | "standalone";

// Every desk variant takes the same props, so the modal and the full
// /stickers page can render any of them.
export type StickerDisplayProps = {
  onClose: () => void;
};

export type DeskVariantModule = {
  kind?: "desk";
  default: ComponentType<StickerDisplayProps>;
  pickerPosition: "top" | "bottom";
};

export type SectionVariantModule = {
  kind: "inline" | "standalone";
  default: ComponentType;
  pickerPosition: "top" | "bottom";
};

export type VariantModule = DeskVariantModule | SectionVariantModule;
