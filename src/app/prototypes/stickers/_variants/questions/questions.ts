import type { StickerDefinition } from "@/components/sticker-data";

export type StickerId = StickerDefinition["id"];

type Question = {
  question: string;
  related: readonly [
    StickerId,
    StickerId,
  ];
};

export const QUESTIONS: Record<StickerId, Question> = {
  keyboard: {
    question: "What does your childhood sound like?",
    related: [
      "controller",
      "pencil",
    ],
  },
  controller: {
    question: "What did you call it at the end of your street?",
    related: [
      "pencil",
      "pyramids",
    ],
  },
  pencil: {
    question: "What reminds you of your father?",
    related: [
      "pyramids",
      "burj",
    ],
  },
  pyramids: {
    question: "What can nobody take away from you?",
    related: [
      "burj",
      "monstera",
    ],
  },
  burj: {
    question: "When did Dubai become home?",
    related: [
      "monstera",
      "babylon",
    ],
  },
  monstera: {
    question: "What improves your mornings?",
    related: [
      "babylon",
      "bass",
    ],
  },
  babylon: {
    question: "What impression do you want to leave?",
    related: [
      "bass",
      "keyboard",
    ],
  },
  bass: {
    question: "What did you learn by listening properly?",
    related: [
      "keyboard",
      "controller",
    ],
  },
};

export const QUESTION_ORDER: readonly StickerId[] = [
  "keyboard",
  "controller",
  "pencil",
  "pyramids",
  "burj",
  "monstera",
  "babylon",
  "bass",
];
