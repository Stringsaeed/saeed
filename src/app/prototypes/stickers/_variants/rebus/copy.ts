import type { StickerDefinition } from "@/components/sticker-data";

// A sticker stuck over a noun. `word` is what the sticker hides and what the
// accessibility tree reads; `wordArabic` is shown instead when the street
// name is the real one.
export type RebusSlot = {
  id: StickerDefinition["id"];
  word: string;
  wordArabic?: string;
};

export type RebusToken = string | RebusSlot;

export const EYEBROW = {
  arabic: "أشياء تشبهني",
  gloss: "things that are like me",
};

// Draft copy for Saeed to rewrite. The order is the reading order: the
// pencil stays seventh so the father story lands before the perfume coda.
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
    wordArabic: "يابانية",
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
