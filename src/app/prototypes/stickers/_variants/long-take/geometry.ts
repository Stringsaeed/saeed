import type { StickerDefinition } from "@/components/sticker-data";

export type StickerId = StickerDefinition["id"];

// The walk, in the order of his life: Egypt, Dubai, the 90s, the street,
// 2013, home now, and the pencil last.
export const WALK: StickerId[] = [
  "pyramids",
  "burj",
  "keyboard",
  "controller",
  "bass",
  "monstera",
  "babylon",
  "pencil",
];

// The step after the pencil: the end of the take, where the word is written.
export const CODA = WALK.length;

// Milestones along the corridor, each lifted from that sticker's story.
export const MILESTONES: Record<StickerId, string> = {
  pyramids: "Giza · the longest river",
  burj: "Dubai · 30 years",
  keyboard: "the 90s",
  controller: "the end of the street",
  bass: "2013",
  monstera: "home · mornings",
  babylon: "walking in, walking out",
  pencil: "for my father",
};

// سعيد, written by hand in a 1000 × 420 box, traced over IBM Plex Sans
// Arabic so it stays legible. One pen stroke, right to left, starting at the
// first tooth of the seen, where the pencil rests.
export const WORD_PATH =
  "M 820 182 C 822 215, 828 250, 812 262 C 800 272, 772 272, 758 258 C 750 250, 750 230, 750 197 L 750 250 C 748 266, 726 272, 705 270 C 684 268, 664 262, 655 252 L 669 199 L 651 252 C 640 264, 620 265, 600 265 L 545 265 C 530 264, 528 250, 540 238 C 560 220, 582 205, 580 185 C 578 165, 550 157, 515 158 C 490 159, 470 165, 455 172 L 515 245 C 522 256, 510 265, 488 265 L 425 265 C 405 265, 383 258, 382 235 L 382 170 L 381 240 C 378 258, 360 265, 335 265 L 300 265 C 288 265, 282 258, 280 248 L 238 117 L 280 248 C 276 262, 262 265, 240 265 L 190 265 C 176 265, 170 258, 170 248 L 170 226";

// The two dots under the yaa, set down after the stroke lands.
export const WORD_DOTS = [
  "M 399 306 h 0.5",
  "M 363 306 h 0.5",
];

export const WORD_BOX = {
  width: 1000,
  height: 420,
};

// Each stop sits on the pen's path: the walk's rises and dips are the word's.
const ANCHORS: Record<
  StickerId,
  readonly [
    number,
    number,
  ]
> = {
  pyramids: [
    172,
    236,
  ],
  burj: [
    240,
    122,
  ],
  keyboard: [
    318,
    265,
  ],
  controller: [
    382,
    172,
  ],
  bass: [
    516,
    159,
  ],
  monstera: [
    602,
    265,
  ],
  babylon: [
    750,
    198,
  ],
  pencil: [
    821,
    183,
  ],
};

// Centre of the written word (dots included) and its extent.
const WORD_CENTER = [
  496,
  222,
] as const;
const WORD_SPAN = {
  width: 680,
  height: 230,
};

export type Geometry = {
  vertical: boolean;
  reduced: boolean;
  vw: number;
  vh: number;
  box: number;
  // Scroll distance for one step of the walk.
  seg: number;
  // Distance between stops along the corridor.
  gap: number;
  focusX: number;
  focusY: number;
  meander: number;
  // The overview: where the word is written.
  overScale: number;
  overX: number;
  overY: number;
  overSize: number;
  // Story column.
  storyTop: number;
  storyLeft: number;
  storyRight: number;
  storyBottom: number;
  codaTop: number;
  inkWidth: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function measure(vw: number, vh: number, reduced: boolean): Geometry {
  const vertical = vw < 768;
  // Leave the bottom clear for the prototype picker.
  const bottomClear = 92;
  if (!vertical) {
    const box = Math.round(clamp(vh * 0.26, 140, 210));
    const focusX = Math.round(vw * 0.34);
    const focusY = Math.round(vh * 0.5);
    const overScale = reduced
      ? Math.min((vw * 0.5) / WORD_SPAN.width, (vh * 0.5) / WORD_SPAN.height)
      : Math.min((vw * 0.8) / WORD_SPAN.width, (vh * 0.42) / WORD_SPAN.height);
    const overX = reduced ? vw * 0.29 : vw / 2;
    const overY = reduced ? vh * 0.5 : vh * 0.45;
    return {
      vertical,
      reduced,
      vw,
      vh,
      box,
      seg: Math.round(vh * 0.6),
      gap: Math.round(Math.max(box * 2.3, vw * 0.4)),
      focusX,
      focusY,
      meander: vh * 0.11,
      overScale,
      overX,
      overY,
      overSize: clamp(52 * overScale, 30, 80),
      storyTop: 112,
      storyLeft: reduced
        ? Math.round(vw * 0.58)
        : Math.round(focusX + box * 0.65 + 32),
      storyRight: 48,
      storyBottom: bottomClear,
      codaTop: Math.round(overY + (306 - WORD_CENTER[1]) * overScale + 40),
      inkWidth: 2.4 / overScale,
    };
  }
  const box = Math.round(clamp(vw * 0.38, 116, 160));
  const focusY = Math.round(Math.max(vh * 0.28, 112 + box / 2));
  const overScale = reduced
    ? Math.min((vw * 0.88) / WORD_SPAN.width, (vh * 0.22) / WORD_SPAN.height)
    : Math.min((vw * 0.9) / WORD_SPAN.width, (vh * 0.3) / WORD_SPAN.height);
  const overY = reduced
    ? 120 + (WORD_CENTER[1] - 117) * overScale
    : Math.round(vh * 0.42);
  return {
    vertical,
    reduced,
    vw,
    vh,
    box,
    seg: Math.round(vh * 0.5),
    gap: Math.round(vh * 0.4),
    focusX: Math.round(vw / 2),
    focusY,
    meander: vw * 0.13,
    overScale,
    overX: vw / 2,
    overY,
    overSize: clamp(52 * overScale, 30, 80),
    storyTop: reduced
      ? Math.round(overY + (306 - WORD_CENTER[1]) * overScale + 36)
      : Math.round(focusY + box / 2 + 44),
    storyLeft: 16,
    storyRight: 16,
    storyBottom: bottomClear,
    codaTop: Math.round(overY + (306 - WORD_CENTER[1]) * overScale + 36),
    inkWidth: 1.8 / overScale,
  };
}

// Rise or dip of a stop, from the word's stroke heights.
function meanderOf(index: number) {
  return (ANCHORS[WALK[index]][1] - 200) / 100;
}

export function walkPoint(geo: Geometry, index: number, progress: number) {
  const along = (index - progress) * geo.gap;
  const across = meanderOf(index) * geo.meander;
  return geo.vertical
    ? {
        x: geo.focusX + across,
        y: geo.focusY + along,
      }
    : {
        x: geo.focusX + along,
        y: geo.focusY + across,
      };
}

export function overviewPoint(geo: Geometry, index: number) {
  const [x, y] = ANCHORS[WALK[index]];
  return {
    x: geo.overX + (x - WORD_CENTER[0]) * geo.overScale,
    y: geo.overY + (y - WORD_CENTER[1]) * geo.overScale,
  };
}

// Where the word's 1000 × 420 box sits on screen.
export function inkFrame(geo: Geometry) {
  return {
    x: geo.overX - WORD_CENTER[0] * geo.overScale,
    y: geo.overY - WORD_CENTER[1] * geo.overScale,
    width: WORD_BOX.width * geo.overScale,
    height: WORD_BOX.height * geo.overScale,
  };
}

// The corridor floor: a soft thread through every stop, in corridor space
// (stop 0 at the origin), run out past both ends.
export function floorPath(geo: Geometry) {
  const points: [
    number,
    number,
  ][] = [];
  const toPoint = (
    along: number,
    across: number,
  ): [
    number,
    number,
  ] =>
    geo.vertical
      ? [
          across,
          along,
        ]
      : [
          along,
          across,
        ];
  points.push(toPoint(-geo.gap * 1.5, meanderOf(0) * geo.meander));
  for (let index = 0; index < WALK.length; index++) {
    points.push(toPoint(index * geo.gap, meanderOf(index) * geo.meander));
  }
  points.push(
    toPoint(
      (WALK.length - 1 + 0.8) * geo.gap,
      meanderOf(WALK.length - 1) * geo.meander,
    ),
  );
  const f = (value: number) => value.toFixed(1);
  let d = `M ${f(points[0][0])} ${f(points[0][1])}`;
  for (let index = 0; index < points.length - 1; index++) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${f(c1x)} ${f(c1y)}, ${f(c2x)} ${f(c2y)}, ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}
