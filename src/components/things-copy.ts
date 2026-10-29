import type { StickerDefinition } from "@/components/sticker-data";

// A sticker standing in for a noun. `word` is what the sticker replaces; it
// is read by assistive tech (as the image's alt) but never shown.
export type ThingSlot = {
  id: StickerDefinition["id"];
  word: string;
};

export type ThingToken = string | ThingSlot;

// One clause of the sentence. `lead` is its subject and verb, always
// readable and pressable; `rest` is redacted until the lead is pressed.
export type ThingClause = {
  id: StickerDefinition["id"];
  lead: string;
  rest: ThingToken[];
};

// One word, set like the other section headings on the home page.
export const TITLE = "Things";

// Draft copy for Saeed to rewrite. The order is the reading order. Joiners
// ("and", ".", ",") sit at the edges of the rest, so when a clause is
// still redacted the leads read as a list: I grew up, and live, I listen…
export const CLAUSES: ThingClause[] = [
  {
    id: "pyramids",
    lead: "I grew up",
    rest: [
      " beside the ",
      {
        id: "pyramids",
        word: "pyramids",
      },
    ],
  },
  {
    id: "burj",
    lead: "and live",
    rest: [
      " under the ",
      {
        id: "burj",
        word: "Burj",
      },
      ".",
    ],
  },
  {
    id: "bass",
    lead: "I listen",
    rest: [
      " for the ",
      {
        id: "bass",
        word: "bass",
      },
      " first,",
    ],
  },
  {
    id: "keyboard",
    lead: "type",
    rest: [
      " on a ",
      {
        id: "keyboard",
        word: "keyboard",
      },
      " because I’m a 90s kid,",
    ],
  },
  {
    id: "controller",
    lead: "still play",
    rest: [
      " ",
      {
        id: "controller",
        word: "PlayStation",
      },
      " since Winning Eleven,",
    ],
  },
  {
    id: "monstera",
    lead: "water",
    rest: [
      " two ",
      {
        id: "monstera",
        word: "monsteras",
      },
      " every morning,",
    ],
  },
  {
    id: "pencil",
    lead: "keep",
    rest: [
      " a ",
      {
        id: "pencil",
        word: "pencil",
      },
      " that reminds me of my father,",
    ],
  },
  {
    id: "babylon",
    lead: "and leave rooms",
    rest: [
      " smelling of ",
      {
        id: "babylon",
        word: "Babylon",
      },
      ".",
    ],
  },
];
