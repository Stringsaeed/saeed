import type { StickerDefinition } from "@/components/sticker-data";

type StickerId = StickerDefinition["id"];
export type Place = Extract<StickerId, "pyramids" | "burj">;
export type Rhythm = Extract<StickerId, "bass" | "keyboard" | "controller">;
export type Keepsake = Extract<StickerId, "monstera" | "pencil" | "babylon">;
export type Portrait = {
  place: Place;
  rhythm: Rhythm;
  keepsake: Keepsake;
};
export type Lane = keyof Portrait;
export type CompositionKey = `${Place}/${Rhythm}/${Keepsake}`;
export type Placement = {
  x: number;
  y: number;
  width: number;
  rotation: number;
  z: number;
};
type Composition = Record<Lane, Placement>;

export const DEFAULT_PORTRAIT: Portrait = {
  place: "pyramids",
  rhythm: "bass",
  keepsake: "pencil",
};
export const LANES: Lane[] = [
  "place",
  "rhythm",
  "keepsake",
];
export const GROUPS: {
  [L in Lane]: {
    label: string;
    options: {
      id: Portrait[L];
      label: string;
    }[];
  };
} = {
  place: {
    label: "A place",
    options: [
      {
        id: "pyramids",
        label: "Egypt",
      },
      {
        id: "burj",
        label: "Dubai",
      },
    ],
  },
  rhythm: {
    label: "A rhythm",
    options: [
      {
        id: "bass",
        label: "Bass",
      },
      {
        id: "keyboard",
        label: "Keyboard",
      },
      {
        id: "controller",
        label: "PlayStation",
      },
    ],
  },
  keepsake: {
    label: "Something I keep close",
    options: [
      {
        id: "monstera",
        label: "Monstera",
      },
      {
        id: "pencil",
        label: "Pencil",
      },
      {
        id: "babylon",
        label: "Babylon",
      },
    ],
  },
};

export function compositionKey(portrait: Portrait): CompositionKey {
  return `${portrait.place}/${portrait.rhythm}/${portrait.keepsake}`;
}

export function parsePortrait(value: string | null): Portrait {
  const [place, rhythm, keepsake] = value?.split("/") ?? [];
  if (
    (place === "pyramids" || place === "burj") &&
    (rhythm === "bass" || rhythm === "keyboard" || rhythm === "controller") &&
    (keepsake === "monstera" || keepsake === "pencil" || keepsake === "babylon")
  ) {
    return {
      place,
      rhythm,
      keepsake,
    };
  }
  return DEFAULT_PORTRAIT;
}

// Each triptych is authored in a 360 × 300 frame. Repeated anchors are
// intentional: switching one lane must leave the other two objects still.
export const COMPOSITIONS: Record<CompositionKey, Composition> = {
  "pyramids/bass/monstera": {
    place: {
      x: 15,
      y: 151,
      width: 260,
      rotation: -4,
      z: 1,
    },
    rhythm: {
      x: 31,
      y: 24,
      width: 168,
      rotation: -12,
      z: 2,
    },
    keepsake: {
      x: 164,
      y: 4,
      width: 193,
      rotation: 5,
      z: 3,
    },
  },
  "pyramids/bass/pencil": {
    place: {
      x: 15,
      y: 151,
      width: 260,
      rotation: -4,
      z: 1,
    },
    rhythm: {
      x: 31,
      y: 24,
      width: 168,
      rotation: -12,
      z: 2,
    },
    keepsake: {
      x: 144,
      y: 53,
      width: 190,
      rotation: 85,
      z: 3,
    },
  },
  "pyramids/bass/babylon": {
    place: {
      x: 15,
      y: 151,
      width: 260,
      rotation: -4,
      z: 1,
    },
    rhythm: {
      x: 31,
      y: 24,
      width: 168,
      rotation: -12,
      z: 2,
    },
    keepsake: {
      x: 205,
      y: 64,
      width: 112,
      rotation: 8,
      z: 3,
    },
  },
  "pyramids/keyboard/monstera": {
    place: {
      x: 15,
      y: 151,
      width: 260,
      rotation: -4,
      z: 1,
    },
    rhythm: {
      x: 8,
      y: 115,
      width: 205,
      rotation: -18,
      z: 2,
    },
    keepsake: {
      x: 164,
      y: 4,
      width: 193,
      rotation: 5,
      z: 3,
    },
  },
  "pyramids/keyboard/pencil": {
    place: {
      x: 15,
      y: 151,
      width: 260,
      rotation: -4,
      z: 1,
    },
    rhythm: {
      x: 8,
      y: 115,
      width: 205,
      rotation: -18,
      z: 2,
    },
    keepsake: {
      x: 144,
      y: 53,
      width: 190,
      rotation: 85,
      z: 3,
    },
  },
  "pyramids/keyboard/babylon": {
    place: {
      x: 15,
      y: 151,
      width: 260,
      rotation: -4,
      z: 1,
    },
    rhythm: {
      x: 8,
      y: 115,
      width: 205,
      rotation: -18,
      z: 2,
    },
    keepsake: {
      x: 205,
      y: 64,
      width: 112,
      rotation: 8,
      z: 3,
    },
  },
  "pyramids/controller/monstera": {
    place: {
      x: 15,
      y: 151,
      width: 260,
      rotation: -4,
      z: 1,
    },
    rhythm: {
      x: 11,
      y: 109,
      width: 196,
      rotation: -16,
      z: 2,
    },
    keepsake: {
      x: 164,
      y: 4,
      width: 193,
      rotation: 5,
      z: 3,
    },
  },
  "pyramids/controller/pencil": {
    place: {
      x: 15,
      y: 151,
      width: 260,
      rotation: -4,
      z: 1,
    },
    rhythm: {
      x: 11,
      y: 109,
      width: 196,
      rotation: -16,
      z: 2,
    },
    keepsake: {
      x: 144,
      y: 53,
      width: 190,
      rotation: 85,
      z: 3,
    },
  },
  "pyramids/controller/babylon": {
    place: {
      x: 15,
      y: 151,
      width: 260,
      rotation: -4,
      z: 1,
    },
    rhythm: {
      x: 11,
      y: 109,
      width: 196,
      rotation: -16,
      z: 2,
    },
    keepsake: {
      x: 205,
      y: 64,
      width: 112,
      rotation: 8,
      z: 3,
    },
  },
  "burj/bass/monstera": {
    place: {
      x: 85,
      y: 53,
      width: 73,
      rotation: 0,
      z: 1,
    },
    rhythm: {
      x: 31,
      y: 24,
      width: 168,
      rotation: -12,
      z: 2,
    },
    keepsake: {
      x: 164,
      y: 4,
      width: 193,
      rotation: 5,
      z: 3,
    },
  },
  "burj/bass/pencil": {
    place: {
      x: 85,
      y: 53,
      width: 73,
      rotation: 0,
      z: 1,
    },
    rhythm: {
      x: 31,
      y: 24,
      width: 168,
      rotation: -12,
      z: 2,
    },
    keepsake: {
      x: 144,
      y: 53,
      width: 190,
      rotation: 85,
      z: 3,
    },
  },
  "burj/bass/babylon": {
    place: {
      x: 85,
      y: 53,
      width: 73,
      rotation: 0,
      z: 1,
    },
    rhythm: {
      x: 31,
      y: 24,
      width: 168,
      rotation: -12,
      z: 2,
    },
    keepsake: {
      x: 205,
      y: 64,
      width: 112,
      rotation: 8,
      z: 3,
    },
  },
  "burj/keyboard/monstera": {
    place: {
      x: 85,
      y: 53,
      width: 73,
      rotation: 0,
      z: 1,
    },
    rhythm: {
      x: 8,
      y: 115,
      width: 205,
      rotation: -18,
      z: 2,
    },
    keepsake: {
      x: 164,
      y: 4,
      width: 193,
      rotation: 5,
      z: 3,
    },
  },
  "burj/keyboard/pencil": {
    place: {
      x: 85,
      y: 53,
      width: 73,
      rotation: 0,
      z: 1,
    },
    rhythm: {
      x: 8,
      y: 115,
      width: 205,
      rotation: -18,
      z: 2,
    },
    keepsake: {
      x: 144,
      y: 53,
      width: 190,
      rotation: 85,
      z: 3,
    },
  },
  "burj/keyboard/babylon": {
    place: {
      x: 85,
      y: 53,
      width: 73,
      rotation: 0,
      z: 1,
    },
    rhythm: {
      x: 8,
      y: 115,
      width: 205,
      rotation: -18,
      z: 2,
    },
    keepsake: {
      x: 205,
      y: 64,
      width: 112,
      rotation: 8,
      z: 3,
    },
  },
  "burj/controller/monstera": {
    place: {
      x: 85,
      y: 53,
      width: 73,
      rotation: 0,
      z: 1,
    },
    rhythm: {
      x: 11,
      y: 109,
      width: 196,
      rotation: -16,
      z: 2,
    },
    keepsake: {
      x: 164,
      y: 4,
      width: 193,
      rotation: 5,
      z: 3,
    },
  },
  "burj/controller/pencil": {
    place: {
      x: 85,
      y: 53,
      width: 73,
      rotation: 0,
      z: 1,
    },
    rhythm: {
      x: 11,
      y: 109,
      width: 196,
      rotation: -16,
      z: 2,
    },
    keepsake: {
      x: 144,
      y: 53,
      width: 190,
      rotation: 85,
      z: 3,
    },
  },
  "burj/controller/babylon": {
    place: {
      x: 85,
      y: 53,
      width: 73,
      rotation: 0,
      z: 1,
    },
    rhythm: {
      x: 11,
      y: 109,
      width: 196,
      rotation: -16,
      z: 2,
    },
    keepsake: {
      x: 205,
      y: 64,
      width: 112,
      rotation: 8,
      z: 3,
    },
  },
};
