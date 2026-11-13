import * as THREE from "three";
import { redraw } from "./retro-material";

// The film the projector shows: a countdown leader, a sunrise over the
// pyramids, and FIN. Drawn into a canvas a few dozen pixels across, twelve
// frames a second, so the retro pass has very little left to do.

const W = 64;
const H = 36;
const FRAME = 1 / 12;

const COUNT_FROM = 5;
const PER_NUMBER = 9;
const LEADER = COUNT_FROM * PER_NUMBER;
const FEATURE = 40;
const FIN = 26;
const LENGTH = LEADER + FEATURE + FIN;

const GLYPHS: Record<string, readonly string[]> = {
  "1": [
    "..#..",
    ".##..",
    "..#..",
    "..#..",
    "..#..",
    "..#..",
    ".###.",
  ],
  "2": [
    ".###.",
    "#...#",
    "....#",
    "...#.",
    "..#..",
    ".#...",
    "#####",
  ],
  "3": [
    ".###.",
    "#...#",
    "....#",
    "..##.",
    "....#",
    "#...#",
    ".###.",
  ],
  "4": [
    "...#.",
    "..##.",
    ".#.#.",
    "#..#.",
    "#####",
    "...#.",
    "...#.",
  ],
  "5": [
    "#####",
    "#....",
    "####.",
    "....#",
    "....#",
    "#...#",
    ".###.",
  ],
  F: [
    "#####",
    "#....",
    "#....",
    "####.",
    "#....",
    "#....",
    "#....",
  ],
  I: [
    ".###.",
    "..#..",
    "..#..",
    "..#..",
    "..#..",
    "..#..",
    ".###.",
  ],
  N: [
    "#...#",
    "##..#",
    "#.#.#",
    "#.#.#",
    "#..##",
    "#...#",
    "#...#",
  ],
};

function glyph(
  context: CanvasRenderingContext2D,
  char: string,
  x: number,
  y: number,
  scale: number,
) {
  const rows = GLYPHS[char];
  if (!rows) return;
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] === "#") {
        context.fillRect(x + c * scale, y + r * scale, scale, scale);
      }
    }
  });
}

function text(context: CanvasRenderingContext2D, value: string, scale: number) {
  const advance = 6 * scale;
  const width = value.length * advance - scale;
  const x = Math.round((W - width) / 2);
  const y = Math.round((H - 7 * scale) / 2);
  [
    ...value,
  ].forEach((char, index) => {
    glyph(context, char, x + index * advance, y, scale);
  });
}

function drawLeader(context: CanvasRenderingContext2D, frame: number) {
  const number = COUNT_FROM - Math.floor(frame / PER_NUMBER);
  const turn = (frame % PER_NUMBER) / PER_NUMBER;
  context.fillStyle = "#efe9d6";
  context.fillRect(0, 0, W, H);
  // The wipe that sweeps round once for every number.
  context.fillStyle = "#b4ad98";
  context.beginPath();
  context.moveTo(W / 2, H / 2);
  context.arc(W / 2, H / 2, W, -Math.PI / 2, -Math.PI / 2 + turn * Math.PI * 2);
  context.closePath();
  context.fill();
  context.strokeStyle = "#101010";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, H / 2 + 0.5);
  context.lineTo(W, H / 2 + 0.5);
  context.moveTo(W / 2 + 0.5, 0);
  context.lineTo(W / 2 + 0.5, H);
  context.stroke();
  for (const radius of [
    15.5,
    12.5,
  ]) {
    context.beginPath();
    context.arc(W / 2, H / 2, radius, 0, Math.PI * 2);
    context.stroke();
  }
  context.fillStyle = "#000000";
  text(context, String(number), 3);
}

function drawFeature(context: CanvasRenderingContext2D, frame: number) {
  const t = frame / FEATURE;
  const horizon = 25;
  // Dawn: three bands of sky, a sun coming up, and where I grew up.
  const sky = [
    "#f6c98a",
    "#f0a868",
    "#e58a5a",
  ];
  sky.forEach((color, band) => {
    context.fillStyle = color;
    context.fillRect(0, (band * horizon) / 3, W, horizon / 3 + 1);
  });
  context.fillStyle = "#fff4cf";
  context.beginPath();
  context.arc(40, horizon + 4 - t * 17, 5, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#5a3b2e";
  for (const [x, size] of [
    [
      16,
      13,
    ],
    [
      31,
      9,
    ],
    [
      44,
      6,
    ],
  ]) {
    context.beginPath();
    context.moveTo(x - size, horizon);
    context.lineTo(x, horizon - size);
    context.lineTo(x + size, horizon);
    context.closePath();
    context.fill();
  }
  context.fillStyle = "#3a2622";
  context.fillRect(0, horizon, W, H - horizon);
}

function drawFin(context: CanvasRenderingContext2D) {
  context.fillStyle = "#000000";
  context.fillRect(0, 0, W, H);
  context.fillStyle = "#f2ecdc";
  text(context, "FIN", 2);
}

export type Film = {
  texture: THREE.CanvasTexture;
  readonly playing: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  /** Advances the reel. Says whether the picture changed. */
  tick: (dt: number) => boolean;
  /** Told when the film starts or stops. */
  watch: (listener: (playing: boolean) => void) => () => void;
  dispose: () => void;
};

let current: Film | null = null;

/** The one film in the office. The screen and the projector both hold it. */
export function film(): Film {
  if (current) return current;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  const listeners = new Set<(playing: boolean) => void>();
  let playing = false;
  let frame = 0;
  let clock = 0;

  function draw() {
    if (!context) return;
    if (frame < LEADER) drawLeader(context, frame);
    else if (frame < LEADER + FEATURE) drawFeature(context, frame - LEADER);
    else drawFin(context);
    // Old stock: a scratch somewhere new on every frame.
    context.fillStyle = "rgba(255, 255, 255, 0.5)";
    context.fillRect(Math.floor(Math.random() * W), 0, 1, H);
    texture.needsUpdate = true;
  }

  function set(next: boolean) {
    if (playing === next) return;
    playing = next;
    frame = 0;
    clock = 0;
    if (playing) draw();
    for (const listener of listeners) listener(playing);
    for (const fn of redraw) fn();
  }

  current = {
    texture,
    get playing() {
      return playing;
    },
    start: () => set(true),
    stop: () => set(false),
    toggle: () => set(!playing),
    tick(dt) {
      if (!playing) return false;
      clock += dt;
      if (clock < FRAME) return false;
      clock -= FRAME;
      frame++;
      if (frame >= LENGTH) {
        set(false);
        return true;
      }
      draw();
      return true;
    },
    watch(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      texture.dispose();
      listeners.clear();
      current = null;
    },
  };
  return current;
}
