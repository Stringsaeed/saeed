import type { StickerDefinition } from "@/components/sticker-data";

export type StickerId = StickerDefinition["id"];

// The corner a reader grabs. The sticker hinges on the opposite one.
export type Corner = "tl" | "tr" | "bl" | "br";

type Place = {
  x: number;
  y: number;
  w: number;
};

type Insets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type Frame = {
  corner: Corner;
  provenance: string;
  // Positions on each artboard, in artboard pixels; heights follow the art.
  wide: Place;
  narrow: Place;
  // Re-stuck by hand never sits flush: the offset that lets the sun-faded
  // ghost of the first position show along one edge.
  restick: {
    x: number;
    y: number;
    r: number;
  };
  // Where the story is printed inside the hole, as % of the art box. Only for
  // a silhouette with a real rectangle in it and a story short enough to fit;
  // the rest are printed on the liner below the sheet.
  cavity?: Insets;
};

// Two die-cut layouts: four across two rows on a wide sheet, with Burj and
// Babylon in tall slots (Babylon tall enough to carry its story in its
// hole), and two across on a phone.
export const ARTBOARD = {
  wide: {
    w: 600,
    h: 450,
  },
  narrow: {
    w: 300,
    h: 724,
  },
} as const;

export const FRAMES: Record<StickerId, Frame> = {
  pyramids: {
    corner: "tr",
    provenance: "Giza",
    wide: {
      x: 0,
      y: 62,
      w: 172,
    },
    narrow: {
      x: 0,
      y: 18,
      w: 176,
    },
    restick: {
      x: 3,
      y: -2,
      r: 1.4,
    },
  },
  burj: {
    corner: "tr",
    provenance: "Dubai, thirty years",
    wide: {
      x: 190,
      y: 0,
      w: 80,
    },
    narrow: {
      x: 204,
      y: 0,
      w: 84,
    },
    restick: {
      x: -2,
      y: 3,
      r: -1.6,
    },
  },
  bass: {
    corner: "tl",
    provenance: "2013",
    wide: {
      x: 288,
      y: 8,
      w: 110,
    },
    narrow: {
      x: 36,
      y: 136,
      w: 112,
    },
    restick: {
      x: 2,
      y: 2,
      r: 2,
    },
  },
  keyboard: {
    corner: "tr",
    provenance: "the 90s",
    wide: {
      x: 420,
      y: 10,
      w: 176,
    },
    narrow: {
      x: 0,
      y: 300,
      w: 160,
    },
    restick: {
      x: -3,
      y: 2,
      r: -1.2,
    },
  },
  controller: {
    corner: "br",
    provenance: "the end of the street",
    wide: {
      x: 0,
      y: 262,
      w: 170,
    },
    narrow: {
      x: 164,
      y: 238,
      w: 136,
    },
    restick: {
      x: 2,
      y: -3,
      r: 1.5,
    },
  },
  monstera: {
    corner: "tr",
    provenance: "home",
    wide: {
      x: 188,
      y: 262,
      w: 160,
    },
    narrow: {
      x: 4,
      y: 430,
      w: 146,
    },
    restick: {
      x: -3,
      y: -2,
      r: -2,
    },
  },
  pencil: {
    corner: "tr",
    provenance: "high school",
    wide: {
      x: 290,
      y: 160,
      w: 100,
    },
    narrow: {
      x: 166,
      y: 362,
      w: 130,
    },
    restick: {
      x: 3,
      y: 2,
      r: -1.4,
    },
  },
  babylon: {
    corner: "tl",
    provenance: "woody, earthy",
    wide: {
      x: 404,
      y: 146,
      w: 196,
    },
    narrow: {
      x: 154,
      y: 496,
      w: 146,
    },
    restick: {
      x: -2,
      y: -3,
      r: 1.6,
    },
    // Below the shoulders the bottle is one clean block (the largest
    // rectangle inside its alpha: 52% by 57% of the art box).
    cavity: {
      top: 36,
      right: 25,
      bottom: 9,
      left: 25,
    },
  },
};

// The one pre-lifted corner on a fresh sheet: the only instruction it gives.
export const HINT_ID: StickerId = "monstera";
