import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { ProjectLinkType } from "@/data/projects";
import type { BlueprintMeshPalette } from "@/lib/blueprint-palette";
import { type Cartridge, MAX_STICKERS } from "./cartridges";
import { STICKER_ICONS } from "./sticker-icons";

// The apps as cartridges you could pick off a shelf: rounded plastic in a
// pastel of each app's colour, lit softly, drawn at full resolution. The
// page lays them out as an ordinary grid of buttons; this draws one
// cartridge over each button and moves it when the button is touched.
// One world unit is one CSS pixel, and nothing is drawn while all is still.

export type CartridgeStageOptions = {
  reducedMotion: boolean;
  onReady: () => void;
  /** A drag left a cartridge showing its back, or its front again. */
  onFlip: (id: string, back: boolean) => void;
  /** The link elements for each cartridge, in the order of its links. The
   *  stage keeps each one over the sticker that is drawn for it. */
  links: ReadonlyMap<string, readonly HTMLElement[]>;
  /** Blueprint mode's palette, when it is on as the stage is made. */
  blueprint?: BlueprintMeshPalette | null;
};

type Spring = {
  x: number;
  v: number;
  target: number;
};

type Item = {
  cartridge: Cartridge;
  slot: HTMLElement;
  /** Placed and sized over the slot. */
  holder: THREE.Group;
  /** Turned and tilted by the pointer. */
  body: THREE.Group;
  shadow: THREE.Mesh;
  yaw: Spring;
  pitch: Spring;
  /** Whole turns, from a click or a flick. */
  spin: Spring;
  scale: Spring;
  hovered: boolean;
  pressed: boolean;
  dragging: boolean;
  dragFrom: number;
  /** When the hand last moved it, to tell a flick from a pause. */
  turnedAt: number;
  /** Pointer position over the slot, -1 to 1 each way. */
  aim: THREE.Vector2;
  /** Draws the label and the back again: when its icon or its typeface
   *  arrives, or the style changes. A quick paint draws only what shows,
   *  and leaves the traced icon and a hidden back for a full one. */
  paint: (quick?: boolean) => void;
  /** One per link: the drawn sticker, its link element, and how far it
   *  has popped up under the pointer. */
  stickers: Array<{
    mesh: THREE.Mesh;
    link: HTMLElement;
    pop: Spring;
  }>;
  /** Every mesh on it, with the material it has in each style. Blueprint
   *  mode swaps the material on the same mesh, so the stickers the links
   *  follow are still the ones drawn. */
  parts: Part[];
  disposables: Array<{
    dispose: () => void;
  }>;
};

type Part = {
  mesh: THREE.Mesh;
  photo: THREE.Material;
  blueprint: () => THREE.Material;
  /** Lines along its edges, made the first time blueprint mode needs them. */
  lined: boolean;
  lines?: THREE.LineSegments;
};

/** The colours a label, a back or a sticker is printed in. */
type Print = {
  /** Behind the card: the app's colour on the label. */
  ground: string;
  card: string;
  ink: string;
  soft: string;
  body: string;
  rule: string;
  /** Printed as a drawing: an outlined card and a traced icon. */
  drawing: boolean;
};

const hex = (value: number) => `#${value.toString(16).padStart(6, "0")}`;

function photoPrint(cartridge: Cartridge): Print {
  return {
    ground: cartridge.brand,
    card: "#f6f0e1",
    ink: "#1b1b1f",
    soft: "#8a8474",
    body: "#26262b",
    rule: cartridge.brand,
    drawing: false,
  };
}

function blueprintPrint(palette: BlueprintMeshPalette): Print {
  return {
    ground: hex(palette.core),
    card: hex(palette.core),
    ink: hex(palette.edge),
    soft: hex(palette.facet),
    body: hex(palette.edge),
    rule: hex(palette.facet),
    drawing: true,
  };
}

/** The icon traced as lines in `ink`, the way a draughtsman would copy it:
 *  a Sobel pass over its brightness. Null when it cannot be read, or when a
 *  pale icon leaves almost nothing to trace. */
function traceIcon(icon: HTMLImageElement, size: number, ink: string) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (!context) return null;
  let pixels: Uint8ClampedArray;
  try {
    context.drawImage(icon, 0, 0, size, size);
    pixels = context.getImageData(0, 0, size, size).data;
  } catch {
    return null;
  }
  // Brightness over white, so a transparent icon traces its outline.
  const light = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    const alpha = pixels[i * 4 + 3] / 255;
    const over = (channel: number) => channel * alpha + 255 * (1 - alpha);
    light[i] =
      (0.2126 * over(pixels[i * 4]) +
        0.7152 * over(pixels[i * 4 + 1]) +
        0.0722 * over(pixels[i * 4 + 2])) /
      255;
  }
  const color = new THREE.Color(ink);
  const out = context.createImageData(size, size);
  const at = (x: number, y: number) => light[y * size + x];
  let drawn = 0;
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const gx =
        at(x + 1, y - 1) +
        2 * at(x + 1, y) +
        at(x + 1, y + 1) -
        at(x - 1, y - 1) -
        2 * at(x - 1, y) -
        at(x - 1, y + 1);
      const gy =
        at(x - 1, y + 1) +
        2 * at(x, y + 1) +
        at(x + 1, y + 1) -
        at(x - 1, y - 1) -
        2 * at(x, y - 1) -
        at(x + 1, y - 1);
      const strength = Math.min(
        1,
        Math.max(0, (Math.hypot(gx, gy) - 0.25) * 2.5),
      );
      if (strength <= 0) continue;
      const i = (y * size + x) * 4;
      out.data[i] = color.r * 255;
      out.data[i + 1] = color.g * 255;
      out.data[i + 2] = color.b * 255;
      out.data[i + 3] = strength * 255;
      if (strength > 0.5) drawn++;
    }
  }
  if (drawn < size * size * 0.004) return null;
  context.putImageData(out, 0, 0);
  return canvas;
}

const FOV = 16;
/** How much larger one is while it is out and turned over to be read. */
const PICKED = 1.3;
/** How it sits when nobody is near: turned a little, as on a shelf. */
const REST = {
  yaw: -0.3,
  pitch: 0.05,
};
/** Unit cartridge: one wide. */
const SHELL = {
  width: 1,
  height: 1.14,
  depth: 0.17,
};
const LABEL = {
  width: 0.72,
  height: 0.68,
  y: 0.105,
  /** Texture size; the same shape as the label. */
  px: 540,
  py: 510,
};

/** The printed side: what the app is, as on the back of a game. */
const BACK = {
  width: 0.84,
  height: 0.96,
  px: 600,
  py: 686,
};

function spring(x: number): Spring {
  return {
    x,
    v: 0,
    target: x,
  };
}

/** Advances a spring. Says whether it is still moving. */
function advance(s: Spring, dt: number, stiffness = 170, damping = 19) {
  s.v += (stiffness * (s.target - s.x) - damping * s.v) * dt;
  s.x += s.v * dt;
  if (Math.abs(s.target - s.x) < 5e-4 && Math.abs(s.v) < 5e-3) {
    s.x = s.target;
    s.v = 0;
    return false;
  }
  return true;
}

/** A soft, light version of the app's colour, for the plastic. */
function pastel(brand: string) {
  const color = new THREE.Color(brand);
  const hsl = {
    h: 0,
    s: 0,
    l: 0,
  };
  color.getHSL(hsl);
  // Greys and near-blacks have no hue worth keeping: they become warm grey.
  if (hsl.s < 0.14) return color.setHSL(0.09, 0.08, 0.74);
  return color.setHSL(hsl.h, 0.58, 0.73);
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

/** The label: the app's icon and name on a cream card, like a title screen.
 *  As a drawing, the card is outlined and the icon traced, or boxed and
 *  crossed out where there is nothing to trace, as a drawing marks a place
 *  for a picture. */
function drawLabel(
  context: CanvasRenderingContext2D,
  cartridge: Cartridge,
  icon: HTMLImageElement | null,
  font: string,
  print: Print,
  trace: HTMLCanvasElement | null,
) {
  const { px, py } = LABEL;
  context.fillStyle = print.ground;
  context.fillRect(0, 0, px, py);
  context.fillStyle = print.card;
  roundRect(context, 12, 12, px - 24, py - 24, 18);
  context.fill();

  const size = 236;
  const left = (px - size) / 2;
  const top = 50;
  if (print.drawing) {
    context.strokeStyle = print.ink;
    context.lineWidth = 4;
    roundRect(context, 12, 12, px - 24, py - 24, 18);
    context.stroke();
    context.save();
    context.lineWidth = 3;
    context.setLineDash([
      12,
      9,
    ]);
    roundRect(context, left, top, size, size, 52);
    context.stroke();
    context.restore();
    if (trace) {
      context.save();
      roundRect(context, left, top, size, size, 52);
      context.clip();
      context.drawImage(trace, left, top, size, size);
      context.restore();
    } else {
      context.strokeStyle = print.soft;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(left + 30, top + 30);
      context.lineTo(left + size - 30, top + size - 30);
      context.moveTo(left + size - 30, top + 30);
      context.lineTo(left + 30, top + size - 30);
      context.stroke();
    }
  } else if (icon) {
    context.save();
    context.shadowColor = "rgba(0, 0, 0, 0.22)";
    context.shadowBlur = 18;
    context.shadowOffsetY = 8;
    context.fillStyle = "#ffffff";
    roundRect(context, left, top, size, size, 52);
    context.fill();
    context.restore();
    context.save();
    roundRect(context, left, top, size, size, 52);
    context.clip();
    context.drawImage(icon, left, top, size, size);
    context.restore();
  }

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = print.ink;
  let type = 46;
  context.font = `${type}px ${font}`;
  const name = cartridge.name.toUpperCase();
  while (type > 22 && context.measureText(name).width > px - 70) {
    type -= 2;
    context.font = `${type}px ${font}`;
  }
  context.fillText(name, px / 2, 368);
  context.fillStyle = print.soft;
  context.font = `22px ${font}`;
  context.fillText(
    cartridge.kind === "shipped" ? "SHIPPED" : "SIDE PROJECT",
    px / 2,
    428,
  );
}

/** Breaks a sentence into lines no wider than `width`. */
function wrap(context: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && context.measureText(next).width > width) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** The back: the app's name, what it is, and a barcode for show. */
function drawBack(
  context: CanvasRenderingContext2D,
  cartridge: Cartridge,
  number: string,
  pixel: string,
  text: string,
  print: Print,
) {
  const { px, py } = BACK;
  const margin = 44;
  const inner = px - margin * 2;
  context.fillStyle = print.card;
  context.fillRect(0, 0, px, py);
  if (print.drawing) {
    context.strokeStyle = print.ink;
    context.lineWidth = 4;
    context.strokeRect(14, 14, px - 28, py - 28);
  }
  context.textAlign = "left";
  context.textBaseline = "alphabetic";

  context.fillStyle = print.ink;
  let title = 42;
  const name = cartridge.name.toUpperCase();
  context.font = `${title}px ${pixel}`;
  while (title > 22 && context.measureText(name).width > inner) {
    title -= 2;
    context.font = `${title}px ${pixel}`;
  }
  context.fillText(name, margin, 92);
  // A rule in the app's own colour.
  context.fillStyle = print.rule;
  context.fillRect(margin, 114, inner, print.drawing ? 3 : 8);
  context.fillStyle = print.soft;
  context.font = `21px ${pixel}`;
  context.fillText(
    `${cartridge.kind === "shipped" ? "SHIPPED" : "SIDE PROJECT"}  /  NO. ${number}`,
    margin,
    160,
  );

  // The description, as large as fits between the heading and the barcode.
  const top = 226;
  const room = py - 150 - top;
  let size = 48;
  let lines: string[] = [];
  for (; size >= 28; size -= 2) {
    context.font = `${size}px ${text}`;
    lines = wrap(context, cartridge.description, inner);
    if ((lines.length - 1) * size * 1.28 + size <= room) break;
  }
  context.fillStyle = print.body;
  lines.forEach((line, index) => {
    context.fillText(line, margin, top + size * 0.8 + index * size * 1.28);
  });

  // Bars from the letters of the name: no scanner will read it.
  context.fillStyle = print.ink;
  let x = margin;
  let seed = 7;
  for (const char of `${cartridge.id}${cartridge.id}`) {
    seed = (seed * 31 + char.charCodeAt(0)) % 997;
    const bar = 2 + (seed % 4) * 2;
    if (x + bar > margin + 230) break;
    context.fillRect(x, py - 104, bar, 58);
    x += bar + 3 + (seed % 3) * 2;
  }
  context.textAlign = "right";
  context.fillStyle = print.soft;
  context.font = `21px ${pixel}`;
  context.fillText(
    `${number} / ${String(TOTAL.count).padStart(2, "0")}`,
    px - margin,
    py - 52,
  );
}

/** How many cartridges there are, for the number printed on each. */
const TOTAL = {
  count: 0,
};

/** A blurred oval, for the shadow under each cartridge. */
function shadowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(128, 32, 0, 128, 32, 128);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.55)");
    gradient.addColorStop(0.6, "rgba(0, 0, 0, 0.16)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.save();
    context.translate(0, 32);
    context.scale(1, 0.25);
    context.translate(0, -32);
    context.fillStyle = gradient;
    context.fillRect(0, -96, 256, 256);
    context.restore();
  }
  return new THREE.CanvasTexture(canvas);
}

/** A sticker: a white rounded square with one icon on it, or, as a
 *  drawing, an outlined one. */
function stickerTexture(
  type: ProjectLinkType,
  anisotropy: number,
  palette: BlueprintMeshPalette | null = null,
) {
  const size = 160;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = palette ? hex(palette.core) : "#fffdf7";
    roundRect(context, 6, 6, size - 12, size - 12, 40);
    context.fill();
    context.strokeStyle = palette ? hex(palette.edge) : "rgba(0, 0, 0, 0.14)";
    context.lineWidth = palette ? 7 : 3;
    context.stroke();
    context.fillStyle = palette ? hex(palette.edge) : "#1b1b1f";
    context.translate(size / 2 - 46, size / 2 - 46);
    context.scale(92 / 24, 92 / 24);
    context.fill(new Path2D(STICKER_ICONS[type]), "evenodd");
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

export function createCartridgeStage(
  canvas: HTMLCanvasElement,
  slots: ReadonlyMap<string, HTMLElement>,
  cartridges: readonly Cartridge[],
  options: CartridgeStageOptions,
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  // A room to reflect: it is what makes plastic look like plastic.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.5;
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(-0.5, 0.9, 1);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.6);
  fill.position.set(0.8, -0.2, 0.6);
  scene.add(fill);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 20000);

  // Declared before anything is built: a label that finishes drawing asks
  // for a frame straight away.
  let selected: string | null = null;
  let running = false;
  let frame = 0;
  let last = 0;
  let ready = false;
  let arrived = options.reducedMotion;
  let disposed = false;
  let font = "monospace";
  let textFont = "sans-serif";
  let palette = options.blueprint ?? null;
  TOTAL.count = cartridges.length;

  // ---------------------------------------------------------- the model

  const geometry = {
    shell: new RoundedBoxGeometry(
      SHELL.width,
      SHELL.height,
      SHELL.depth,
      6,
      0.05,
    ),
    bezel: new RoundedBoxGeometry(0.84, 0.8, 0.03, 5, 0.036),
    plate: new RoundedBoxGeometry(0.75, 0.71, 0.014, 4, 0.018),
    art: new THREE.PlaneGeometry(LABEL.width, LABEL.height),
    dash: new RoundedBoxGeometry(0.075, 0.014, 0.012, 2, 0.006),
    button: new RoundedBoxGeometry(0.085, 0.085, 0.014, 3, 0.012),
    play: new THREE.ShapeGeometry(
      new THREE.Shape([
        new THREE.Vector2(-0.016, 0.022),
        new THREE.Vector2(0.022, 0),
        new THREE.Vector2(-0.016, -0.022),
      ]),
    ),
    trough: new RoundedBoxGeometry(0.7, 0.07, 0.02, 3, 0.01),
    ridge: new RoundedBoxGeometry(0.013, 0.052, 0.016, 2, 0.005),
    back: new RoundedBoxGeometry(0.9, 1.02, 0.02, 5, 0.036),
    info: new THREE.PlaneGeometry(BACK.width, BACK.height),
    shadow: new THREE.PlaneGeometry(1.25, 0.3),
  };
  const LINED = new Set<THREE.BufferGeometry>([
    geometry.shell,
    geometry.bezel,
    geometry.plate,
    geometry.button,
    geometry.play,
    geometry.trough,
    geometry.back,
  ]);
  const shadowMap = shadowTexture();
  const shadowMaterial = new THREE.MeshBasicMaterial({
    map: shadowMap,
    transparent: true,
    depthWrite: false,
    opacity: 0.5,
  });
  const cream = new THREE.MeshStandardMaterial({
    color: 0xf6f0e1,
    roughness: 0.7,
  });
  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  const front = SHELL.depth / 2;

  // One sticker material for each kind of link, made when first needed.
  const STICKER = 0.155;
  const stickerShape = new THREE.PlaneGeometry(STICKER, STICKER);
  const stickerKinds = new Map<ProjectLinkType, THREE.MeshStandardMaterial>();
  function stickerFor(type: ProjectLinkType) {
    let material = stickerKinds.get(type);
    if (!material) {
      material = new THREE.MeshStandardMaterial({
        map: stickerTexture(type, anisotropy),
        roughness: 0.5,
        transparent: true,
        alphaTest: 0.5,
      });
      stickerKinds.set(type, material);
    }
    return material;
  }

  // ------------------------------------------------- blueprint mode

  // As a drawing: flat faces in the sheet's colour, lines along the edges.
  // Unlit and not tone mapped, so the palette comes out as it is written.
  const face = new THREE.MeshBasicMaterial({
    toneMapped: false,
    // Behind its own lines, so they are not lost in the face.
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const edge = new THREE.LineBasicMaterial({
    toneMapped: false,
  });
  const blueprintStickers = new Map<ProjectLinkType, THREE.MeshBasicMaterial>();
  function blueprintStickerFor(type: ProjectLinkType) {
    let material = blueprintStickers.get(type);
    if (!material) {
      material = new THREE.MeshBasicMaterial({
        map: stickerTexture(type, anisotropy, palette),
        transparent: true,
        alphaTest: 0.5,
        toneMapped: false,
      });
      blueprintStickers.set(type, material);
    }
    return material;
  }
  /** Sets the shared colours, and drops stickers drawn in old ones. */
  function tint(next: BlueprintMeshPalette) {
    face.color.setHex(next.core);
    edge.color.setHex(next.edge);
    for (const material of blueprintStickers.values()) {
      material.map?.dispose();
      material.dispose();
    }
    blueprintStickers.clear();
  }
  if (palette) tint(palette);

  // The parts whose edges are drawn. A rounded corner is drawn as the steps
  // it is made of, which at this size reads as one firm line. The ridges
  // and dashes are too small to take lines, and the planes print their own.
  const outlines = new Map<THREE.BufferGeometry, THREE.EdgesGeometry>();
  function outlineOf(shape: THREE.BufferGeometry) {
    let outline = outlines.get(shape);
    if (!outline) {
      outline = new THREE.EdgesGeometry(shape, 8);
      outlines.set(shape, outline);
    }
    return outline;
  }

  function dress(item: Item) {
    const drawing = palette !== null;
    for (const part of item.parts) {
      part.mesh.material = drawing ? part.blueprint() : part.photo;
      if (!part.lined) continue;
      if (drawing && !part.lines) {
        part.lines = new THREE.LineSegments(
          outlineOf(part.mesh.geometry),
          edge,
        );
        part.mesh.add(part.lines);
      }
      if (part.lines) part.lines.visible = drawing;
    }
    item.shadow.visible = !drawing;
  }

  function build(
    cartridge: Cartridge,
    slot: HTMLElement,
    number: string,
  ): Item {
    const color = pastel(cartridge.brand);
    const plastic = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.42,
    });
    const recess = new THREE.MeshStandardMaterial({
      color: color.clone().multiplyScalar(0.74),
      roughness: 0.55,
    });

    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = LABEL.px;
    labelCanvas.height = LABEL.py;
    const context = labelCanvas.getContext("2d");
    const texture = new THREE.CanvasTexture(labelCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = anisotropy;
    const art = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.62,
    });
    const backCanvas = document.createElement("canvas");
    backCanvas.width = BACK.px;
    backCanvas.height = BACK.py;
    const backContext = backCanvas.getContext("2d");
    const backTexture = new THREE.CanvasTexture(backCanvas);
    backTexture.colorSpace = THREE.SRGBColorSpace;
    backTexture.anisotropy = anisotropy;
    const printed = new THREE.MeshStandardMaterial({
      map: backTexture,
      roughness: 0.7,
    });
    // As a drawing, the same two canvases, printed in the sheet's colours
    // and shown unlit.
    const artDrawn = new THREE.MeshBasicMaterial({
      map: texture,
      toneMapped: false,
    });
    const printedDrawn = new THREE.MeshBasicMaterial({
      map: backTexture,
      toneMapped: false,
    });
    let icon: HTMLImageElement | null = null;
    // The icon traced, made the first time it is drawn as a drawing, and
    // again only if the ink changes.
    let trace: {
      ink: string;
      canvas: HTMLCanvasElement | null;
    } | null = null;
    const paint = (quick = false) => {
      if (!context || !backContext || disposed) return;
      const style = palette ? blueprintPrint(palette) : photoPrint(cartridge);
      if (!quick && style.drawing && icon && trace?.ink !== style.ink) {
        trace = {
          ink: style.ink,
          canvas: traceIcon(icon, 236, style.ink),
        };
      }
      drawLabel(
        context,
        cartridge,
        icon,
        font,
        style,
        style.drawing && trace?.ink === style.ink ? trace.canvas : null,
      );
      texture.needsUpdate = true;
      if (!quick || selected === cartridge.id) {
        drawBack(backContext, cartridge, number, font, textFont, style);
        backTexture.needsUpdate = true;
      }
      wake();
    };
    paint();
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      icon = image;
      paint();
    };
    image.src = cartridge.logo;

    const body = new THREE.Group();
    const parts: Part[] = [];
    const add = (
      shape: THREE.BufferGeometry,
      material: THREE.Material,
      x: number,
      y: number,
      z: number,
      drawn: () => THREE.Material = () => face,
    ) => {
      const mesh = new THREE.Mesh(shape, material);
      mesh.position.set(x, y, z);
      body.add(mesh);
      parts.push({
        mesh,
        photo: material,
        blueprint: drawn,
        lined: LINED.has(shape),
      });
      return mesh;
    };
    add(geometry.shell, plastic, 0, 0, 0);
    // The label sits in a darker recess, on a cream plate.
    add(geometry.bezel, recess, 0, LABEL.y, front - 0.008);
    add(geometry.plate, cream, 0, LABEL.y, front + 0.006);
    add(geometry.art, art, 0, LABEL.y, front + 0.0135, () => artDrawn);
    for (const x of [
      0.2,
      0.29,
      0.38,
    ]) {
      add(geometry.dash, recess, x, 0.54, front);
    }
    // Along the bottom, a sticker for each place the app can be found,
    // each put on a little crooked.
    const linkEls = options.links.get(cartridge.id) ?? [];
    const stickers = cartridge.links
      .slice(0, MAX_STICKERS)
      .flatMap((link, index) => {
        const el = linkEls[index];
        if (!el) return [];
        const mesh = add(
          stickerShape,
          stickerFor(link.type),
          -0.35 + index * 0.176,
          -0.381,
          front + 0.004 + index * 0.0004,
          () => blueprintStickerFor(link.type),
        );
        mesh.rotation.z =
          ((index * 37 + cartridge.name.length * 11) % 21) / 100 - 0.1;
        return [
          {
            mesh,
            link: el,
            pop: spring(1),
          },
        ];
      });
    // With room to spare, the play button keeps its corner.
    if (stickers.length < MAX_STICKERS) {
      add(geometry.button, recess, 0.36, -0.37, front);
      add(geometry.play, plastic, 0.36, -0.37, front + 0.008);
    }
    // The teeth along the bottom edge.
    add(geometry.trough, recess, -0.02, -0.505, front - 0.004);
    for (let i = 0; i < 24; i++) {
      add(geometry.ridge, plastic, -0.33 + i * 0.027, -0.505, front + 0.003);
    }
    // The back: a recess, and the printed side turned to face out of it.
    add(geometry.back, recess, 0, 0, -front + 0.004);
    add(
      geometry.info,
      printed,
      0,
      0,
      -front - 0.0075,
      () => printedDrawn,
    ).rotation.y = Math.PI;

    const shadow = new THREE.Mesh(geometry.shadow, shadowMaterial);
    shadow.position.set(0, -SHELL.height / 2 - 0.08, -0.4);
    const holder = new THREE.Group();
    holder.add(body, shadow);
    scene.add(holder);

    const item: Item = {
      cartridge,
      slot,
      holder,
      body,
      shadow,
      // They arrive turned away and small, then come round.
      yaw: spring(options.reducedMotion ? REST.yaw : REST.yaw - 1.5),
      pitch: spring(REST.pitch),
      spin: spring(0),
      scale: spring(options.reducedMotion ? 1 : 0.55),
      hovered: false,
      pressed: false,
      dragging: false,
      dragFrom: 0,
      turnedAt: 0,
      aim: new THREE.Vector2(),
      paint,
      stickers,
      parts,
      disposables: [
        plastic,
        recess,
        art,
        texture,
        printed,
        backTexture,
        artDrawn,
        printedDrawn,
      ],
    };
    dress(item);
    return item;
  }

  const items = new Map<string, Item>();
  for (const cartridge of cartridges) {
    const slot = slots.get(cartridge.id);
    const number = String(items.size + 1).padStart(2, "0");
    if (slot) items.set(cartridge.id, build(cartridge, slot, number));
  }

  // The labels use the site's own faces, once they have loaded: the pixel
  // face for names, the text face for the description on the back.
  const root = getComputedStyle(document.documentElement);
  const faces = {
    pixel: root.getPropertyValue("--font-silkscreen").trim(),
    text: root.getPropertyValue("--font-atkinson").trim(),
  };
  Promise.allSettled([
    faces.pixel ? document.fonts.load(`40px ${faces.pixel}`) : null,
    faces.text ? document.fonts.load(`40px ${faces.text}`) : null,
  ]).then(([pixel, text]) => {
    if (disposed) return;
    if (faces.pixel && pixel.status === "fulfilled") font = faces.pixel;
    if (faces.text && text.status === "fulfilled") textFont = faces.text;
    for (const item of items.values()) item.paint();
  });

  // ------------------------------------------------------------- layout

  /** The canvas in CSS pixels, for turning a projection into a position. */
  const viewport = {
    width: 1,
    height: 1,
  };

  function layout() {
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    viewport.width = width;
    viewport.height = height;
    // Sharp, but never more pixels than a large screen's worth.
    const ratio = Math.min(
      window.devicePixelRatio || 1,
      2,
      Math.sqrt(7_000_000 / (width * height)),
    );
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    const distance = height / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    camera.aspect = width / height;
    camera.near = Math.max(10, distance - 900);
    camera.far = distance + 900;
    camera.position.set(width / 2, -height / 2, distance);
    camera.lookAt(width / 2, -height / 2, 0);
    camera.updateProjectionMatrix();
    for (const item of items.values()) {
      const rect = item.slot.getBoundingClientRect();
      const size = Math.min(
        rect.width * 0.8,
        (rect.height * 0.8) / SHELL.height,
      );
      item.holder.position.set(
        rect.left - bounds.left + rect.width / 2,
        -(rect.top - bounds.top + rect.height / 2),
        0,
      );
      item.holder.userData.size = size;
    }
    wake();
  }

  function aimFor(item: Item) {
    const chosen = selected === item.cartridge.id;
    const near = item.hovered || item.dragging;
    // Turned over to be read, it leans only a little toward the pointer,
    // and the other way, because its back is what faces out.
    const lean = chosen ? -0.14 : 0.5;
    item.yaw.target = near ? item.aim.x * lean : chosen ? 0 : REST.yaw;
    item.pitch.target = near
      ? item.aim.y * (chosen ? 0.1 : 0.32)
      : chosen
        ? 0
        : REST.pitch;
    item.scale.target = item.pressed
      ? chosen
        ? PICKED - 0.04
        : 0.96
      : chosen
        ? PICKED
        : near
          ? 1.06
          : 1;
  }

  function step(dt: number) {
    let moving = false;
    for (const item of items.values()) {
      if (options.reducedMotion) {
        // No travel: each value is simply where it should be.
        for (const s of [
          item.yaw,
          item.pitch,
          item.scale,
          item.spin,
        ]) {
          s.x = s.target;
          s.v = 0;
        }
      } else {
        if (advance(item.yaw, dt)) moving = true;
        if (advance(item.pitch, dt)) moving = true;
        if (advance(item.scale, dt, 260, 22)) moving = true;
        if (!item.dragging && advance(item.spin, dt, 60, 13)) moving = true;
      }
      const size = (item.holder.userData.size as number) ?? 100;
      item.holder.scale.setScalar(size * item.scale.x);
      // Out of the row as it grows, so it passes in front of its neighbours.
      item.holder.position.z = Math.max(0, item.scale.x - 1) * size * 1.6;
      item.body.rotation.set(item.pitch.x, item.yaw.x + item.spin.x, 0, "YXZ");
      for (const sticker of item.stickers) {
        if (options.reducedMotion) sticker.pop.x = sticker.pop.target;
        else if (advance(sticker.pop, dt, 320, 20)) moving = true;
        sticker.mesh.scale.setScalar(sticker.pop.x);
      }
      // A lifted cartridge throws a wider, fainter shadow.
      const lift = item.scale.x - 1;
      item.shadow.scale.set(1 + lift * 1.5, 1 + lift * 1.5, 1);
    }
    return moving;
  }

  function loop(now: number) {
    if (disposed) return;
    const dt = Math.min(1 / 30, (now - last) / 1000);
    last = now;
    // Two half steps keep the springs steady on a slow frame.
    const moving = step(dt / 2);
    const still = !step(dt / 2) && !moving;
    renderer.render(scene, camera);
    placeLinks();
    if (!ready) {
      ready = true;
      options.onReady();
    }
    if (still) {
      running = false;
      return;
    }
    frame = requestAnimationFrame(loop);
  }

  const point = new THREE.Vector3();
  const facing = new THREE.Vector3();
  const turn = new THREE.Quaternion();

  /** Keeps each link element over its sticker, and out of reach while the
   *  cartridge shows its back. */
  function placeLinks() {
    for (const item of items.values()) {
      if (!item.stickers.length) continue;
      item.body.getWorldQuaternion(turn);
      const shows = facing.set(0, 0, 1).applyQuaternion(turn).z > 0.45;
      const size = item.holder.scale.x * STICKER;
      for (const sticker of item.stickers) {
        const style = sticker.link.style;
        if (!shows || item.dragging) {
          style.visibility = "hidden";
          continue;
        }
        // One world unit is one CSS pixel, with y turned over.
        sticker.mesh.getWorldPosition(point).project(camera);
        // The links are placed from the grid's corner, and the canvas
        // starts a little outside it.
        const x = ((point.x + 1) / 2) * viewport.width + canvas.offsetLeft;
        const y = ((1 - point.y) / 2) * viewport.height + canvas.offsetTop;
        style.visibility = "visible";
        style.width = `${size.toFixed(1)}px`;
        style.height = `${size.toFixed(1)}px`;
        style.transform = `translate(${(x - size / 2).toFixed(1)}px, ${(y - size / 2).toFixed(1)}px)`;
      }
    }
  }

  function wake() {
    if (running || disposed) return;
    running = true;
    last = performance.now();
    frame = requestAnimationFrame(loop);
  }

  const resize = new ResizeObserver(layout);
  resize.observe(canvas);

  // They come round one after another, the first time they are seen.
  const timers: number[] = [];
  const sight = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting || arrived) return;
      arrived = true;
      let order = 0;
      for (const item of items.values()) {
        timers.push(
          window.setTimeout(() => {
            aimFor(item);
            wake();
          }, order * 45),
        );
        order++;
      }
    },
    {
      threshold: 0.05,
    },
  );
  sight.observe(canvas);

  layout();

  // Full paints, one cartridge per idle moment.
  let finishing = 0;
  const canIdle = typeof window.requestIdleCallback === "function";
  const idle = (callback: () => void) =>
    canIdle
      ? window.requestIdleCallback(callback, {
          timeout: 500,
        })
      : window.setTimeout(callback, 32);
  const cancelIdle = (handle: number) =>
    canIdle ? window.cancelIdleCallback(handle) : window.clearTimeout(handle);
  function finishLater() {
    if (finishing) cancelIdle(finishing);
    const queue = [
      ...items.values(),
    ];
    const next = () => {
      finishing = 0;
      const item = queue.shift();
      if (!item || disposed) return;
      item.paint();
      finishing = idle(next);
    };
    finishing = idle(next);
  }

  return {
    /** The pointer is over a cartridge: `x` and `y` run -1 to 1 across it. */
    point(id: string, x: number, y: number) {
      const item = items.get(id);
      if (!item || !arrived) return;
      item.hovered = true;
      item.aim.set(x, y);
      aimFor(item);
      wake();
    },
    leave(id: string) {
      const item = items.get(id);
      if (!item) return;
      item.hovered = false;
      item.pressed = false;
      aimFor(item);
      wake();
    },
    press(id: string, down: boolean) {
      const item = items.get(id);
      if (!item) return;
      item.pressed = down;
      aimFor(item);
      wake();
    },
    /** A sideways drag turns it by hand; `dx` is in CSS pixels. */
    turn(id: string, dx: number) {
      const item = items.get(id);
      if (!item) return;
      if (!item.dragging) {
        item.dragging = true;
        item.dragFrom = item.spin.x;
      }
      const next = item.dragFrom + dx * 0.012;
      item.spin.v = (next - item.spin.x) * 60;
      item.spin.x = next;
      item.turnedAt = performance.now();
      wake();
    },
    /** Let go: it carries on to whichever side is nearer, a half turn
     *  further if flicked, and says which side that is. */
    drop(id: string) {
      const item = items.get(id);
      if (!item?.dragging) return;
      item.dragging = false;
      // Held still before letting go, it was placed, not thrown.
      if (performance.now() - item.turnedAt > 90) item.spin.v = 0;
      const flick = Math.abs(item.spin.v) > 7 ? Math.sign(item.spin.v) : 0;
      const halves = Math.round(item.spin.x / Math.PI) + flick;
      item.spin.target = halves * Math.PI;
      item.spin.v = THREE.MathUtils.clamp(item.spin.v, -14, 14);
      aimFor(item);
      wake();
      options.onFlip(id, Math.abs(halves) % 2 === 1);
    },
    /** The pointer or the focus is on one of its stickers, or on none. */
    stick(id: string, index: number | null) {
      const item = items.get(id);
      if (!item) return;
      item.stickers.forEach((sticker, at) => {
        sticker.pop.target = at === index ? 1.22 : 1;
      });
      wake();
    },
    /** Turns one over to show its back, and any other back to its front. */
    select(id: string | null) {
      selected = id;
      for (const item of items.values()) {
        const back = Math.abs(Math.round(item.spin.target / Math.PI)) % 2 === 1;
        if (back !== (item.cartridge.id === id)) item.spin.target += Math.PI;
        aimFor(item);
      }
      wake();
    },
    /** Blueprint mode was turned on or off, or its palette changed with
     *  the theme. Draws the change at once, so it lands with the page's. */
    setBlueprint(next: BlueprintMeshPalette | null) {
      if (next === palette) return;
      palette = next;
      if (next) tint(next);
      // Only what shows changes now, under the page's wipe: the faces and
      // the labels, with each icon boxed. The traced icons and the backs
      // follow one cartridge at a time while the page is idle.
      for (const item of items.values()) {
        dress(item);
        item.paint(true);
      }
      if (ready) {
        renderer.render(scene, camera);
        placeLinks();
      }
      wake();
      finishLater();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      if (finishing) cancelIdle(finishing);
      for (const timer of timers) window.clearTimeout(timer);
      resize.disconnect();
      sight.disconnect();
      for (const item of items.values()) {
        for (const thing of item.disposables) thing.dispose();
      }
      for (const shape of Object.values(geometry)) shape.dispose();
      stickerShape.dispose();
      for (const material of [
        ...stickerKinds.values(),
        ...blueprintStickers.values(),
      ]) {
        material.map?.dispose();
        material.dispose();
      }
      for (const outline of outlines.values()) outline.dispose();
      face.dispose();
      edge.dispose();
      shadowMap.dispose();
      shadowMaterial.dispose();
      cream.dispose();
      environment.dispose();
      room.dispose();
      pmrem.dispose();
      // Leave the context as it was found. If this canvas is given a new
      // renderer later, texture uploads must not start out flipped.
      const gl = renderer.getContext();
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      renderer.dispose();
    },
  };
}

export type CartridgeStage = ReturnType<typeof createCartridgeStage>;
