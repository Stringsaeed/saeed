import type { StickerDefinition } from "@/components/sticker-data";

// A sticker standing in for a noun. `word` is what the sticker replaces; it
// is read by assistive tech (as the image's alt) but never shown.
export type RebusSlot = {
  id: StickerDefinition["id"];
  word: string;
};

export type RebusToken = string | RebusSlot;

// One word, set like the other section headings on the home page.
export const TITLE = "Things";

// Draft copy for Saeed to rewrite. The order is the reading order.
export const SENTENCE: RebusToken[] = [
  "I grew up beside the ",
  {
    id: "pyramids",
    word: "pyramids",
  },
  " and live under the ",
  {
    id: "burj",
    word: "Burj",
  },
  ". I listen for the ",
  {
    id: "bass",
    word: "bass",
  },
  " first, type on a ",
  {
    id: "keyboard",
    word: "keyboard",
  },
  " because I’m a 90s kid, still play ",
  {
    id: "controller",
    word: "PlayStation",
  },
  " since Winning Eleven, water two ",
  {
    id: "monstera",
    word: "monsteras",
  },
  " every morning, keep a ",
  {
    id: "pencil",
    word: "pencil",
  },
  " that reminds me of my father, and leave rooms smelling of ",
  {
    id: "babylon",
    word: "Babylon",
  },
  ".",
];

export const SLOTS = SENTENCE.filter(
  (token): token is RebusSlot => typeof token !== "string",
);
