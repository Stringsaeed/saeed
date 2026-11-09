import * as THREE from "three";
import type { StickerDefinition } from "@/components/sticker-data";
import { disposeFlatMaterials, flat } from "./retro-material";

// The eight things, modelled from a handful of primitives each: low-poly on
// purpose, flat-shaded, in a few plain colours. The dithering pass does the
// rest. Units are roughly decimetres; every object stands on y = 0 with its
// origin at the centre of its footprint.

export type ThingId = StickerDefinition["id"];

export type ThingModel = {
  group: THREE.Group;
  /** Radius of the footprint on the desk, for picking and the shadow. */
  radius: number;
  height: number;
};

export type ThingSpec<Id extends string = string> = {
  id: Id;
  name: string;
  /** Resting turn about y, in radians. */
  yaw: number;
  /** Turn back to the resting yaw once on the desk, like a shelved thing. */
  settle?: boolean;
  build: () => ThingModel;
};

const mat = flat;

/** Releases the shared materials once no desk is using them. */
export const disposeThingMaterials = disposeFlatMaterials;

export function disposeThing(model: ThingModel) {
  model.group.traverse((node) => {
    if (node instanceof THREE.Mesh) node.geometry.dispose();
  });
}

function box(
  w: number,
  h: number,
  d: number,
  color: number,
  x = 0,
  y = h / 2,
  z = 0,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  mesh.position.set(x, y, z);
  return mesh;
}

function cylinder(
  rTop: number,
  rBottom: number,
  h: number,
  color: number,
  segments = 8,
  x = 0,
  y = h / 2,
  z = 0,
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBottom, h, segments),
    mat(color),
  );
  mesh.position.set(x, y, z);
  return mesh;
}

// ---------------------------------------------------------------- pyramids

function pyramids(): ThingModel {
  const group = new THREE.Group();
  const sand = 0xd9b56e;
  const shade = 0xc9a25c;
  const spots: Array<
    [
      number,
      number,
      number,
      number,
    ]
  > = [
    [
      1.35,
      1.1,
      -0.35,
      0.1,
    ],
    [
      1.05,
      0.86,
      0.95,
      -0.35,
    ],
    [
      0.62,
      0.5,
      -1.35,
      -0.75,
    ],
  ];
  spots.forEach(([radius, height, x, z], index) => {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(radius, height, 4),
      mat(index === 1 ? shade : sand),
    );
    cone.rotation.y = Math.PI / 4;
    cone.position.set(x, height / 2, z);
    group.add(cone);
  });
  return {
    group,
    radius: 1.7,
    height: 0.95,
  };
}

// -------------------------------------------------------------------- burj

function burj(): ThingModel {
  const group = new THREE.Group();
  const steel = 0xa8bccb;
  const glass = 0x8fa6b8;
  group.add(cylinder(0.2, 0.26, 3.9, steel, 6));
  const spire = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 1.3, 6),
    mat(steel),
  );
  spire.position.y = 3.9 + 0.65;
  group.add(spire);
  const tiers = [
    [
      3.0,
      0.3,
    ],
    [
      2.1,
      0.5,
    ],
    [
      1.3,
      0.7,
    ],
    [
      0.7,
      0.9,
    ],
  ];
  for (const wing of [
    0,
    1,
    2,
  ]) {
    const angle = (wing / 3) * Math.PI * 2 + Math.PI / 6;
    for (const [height, distance] of tiers) {
      const step = box(0.2, height, 0.2, glass);
      step.position.set(
        Math.cos(angle) * distance,
        height / 2,
        Math.sin(angle) * distance,
      );
      step.rotation.y = -angle;
      group.add(step);
    }
  }
  return {
    group,
    radius: 1.0,
    height: 5.2,
  };
}

// -------------------------------------------------------------------- bass

function bass(): ThingModel {
  const group = new THREE.Group();
  const body = 0xc46b2a;
  const maple = 0xdcc08a;
  const guard = 0x1f1f24;
  const chrome = 0xd6d6dc;
  const s = 0.85;
  const thick = 0.2 * s;
  // The body: two bouts and two horns, lying flat.
  const lower = cylinder(0.64 * s, 0.64 * s, thick, body, 12, 0, thick / 2, 0);
  const upper = cylinder(
    0.5 * s,
    0.5 * s,
    thick,
    body,
    12,
    0,
    thick / 2,
    -0.72 * s,
  );
  const hornA = cylinder(
    0.16 * s,
    0.16 * s,
    thick,
    body,
    8,
    -0.5 * s,
    thick / 2,
    -1.15 * s,
  );
  const hornB = cylinder(
    0.14 * s,
    0.14 * s,
    thick,
    body,
    8,
    0.42 * s,
    thick / 2,
    -1.02 * s,
  );
  const pickguard = cylinder(
    0.44 * s,
    0.44 * s,
    0.02,
    guard,
    10,
    0.08 * s,
    thick + 0.01,
    -0.1 * s,
  );
  const pickup = box(0.5 * s, 0.03, 0.14 * s, guard, 0, thick + 0.02, 0.1 * s);
  const bridge = box(
    0.32 * s,
    0.05,
    0.12 * s,
    chrome,
    0,
    thick + 0.03,
    0.5 * s,
  );
  group.add(lower, upper, hornA, hornB, pickguard, pickup, bridge);
  // Neck and headstock run away from the body.
  const neckLength = 2.3 * s;
  const neck = box(
    0.17 * s,
    0.07 * s,
    neckLength,
    maple,
    0,
    thick / 2 + 0.02,
    -1.1 * s - neckLength / 2,
  );
  const head = box(
    0.3 * s,
    0.05 * s,
    0.5 * s,
    maple,
    0.04 * s,
    thick / 2 + 0.02,
    -1.1 * s - neckLength - 0.25 * s,
  );
  group.add(neck, head);
  for (let i = 0; i < 4; i++) {
    const peg = cylinder(
      0.04 * s,
      0.04 * s,
      0.1,
      chrome,
      6,
      0.2 * s,
      thick / 2 + 0.08,
      -1.1 * s - neckLength - 0.08 * s - i * 0.11 * s,
    );
    group.add(peg);
    const string = box(
      0.012,
      0.012,
      neckLength + 1.6 * s,
      chrome,
      (i - 1.5) * 0.035 * s,
      thick + 0.05,
      -1.1 * s - neckLength / 2 + 0.3 * s,
    );
    group.add(string);
  }
  return {
    group,
    radius: 1.9,
    height: thick + 0.1,
  };
}

// ---------------------------------------------------------------- keyboard

function keyboard(): ThingModel {
  const group = new THREE.Group();
  const shell = 0xe6e1d6;
  const keyLight = 0xf6f2ea;
  const keyDark = 0x9d9fa6;
  const accent = 0xe2702e;
  const rows = 4;
  const cols = 12;
  const pitch = 0.19;
  const width = cols * pitch + 0.2;
  const depth = rows * pitch + 0.2;
  group.add(box(width, 0.2, depth, shell));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isAccent = r === 0 && c === 0;
      const dark = (r === 0 && c === cols - 1) || (r === rows - 1 && c < 2);
      const wide = r === rows - 1 && c >= 4 && c <= 7;
      if (wide && c !== 4) continue;
      const key = box(
        wide ? pitch * 4 - 0.04 : pitch - 0.04,
        0.08,
        pitch - 0.04,
        isAccent ? accent : dark ? keyDark : keyLight,
        -width / 2 + 0.1 + c * pitch + (wide ? pitch * 2 : pitch / 2),
        0.2 + 0.04,
        -depth / 2 + 0.1 + r * pitch + pitch / 2,
      );
      group.add(key);
    }
  }
  return {
    group,
    radius: 1.3,
    height: 0.3,
  };
}

// -------------------------------------------------------------- controller

function controller(): ThingModel {
  const group = new THREE.Group();
  const dark = 0x3a3a42;
  const darker = 0x2a2a30;
  const h = 0.26;
  group.add(box(1.5, h, 0.56, dark));
  for (const side of [
    -1,
    1,
  ]) {
    const grip = box(0.36, h, 0.9, dark, side * 0.58, h / 2, 0.32);
    grip.rotation.y = -side * 0.22;
    group.add(grip);
    const stick = cylinder(
      0.11,
      0.08,
      0.14,
      darker,
      8,
      side * 0.26,
      h + 0.07,
      0.14,
    );
    group.add(stick);
  }
  // D-pad on the left, four buttons on the right.
  group.add(box(0.3, 0.05, 0.1, darker, -0.5, h + 0.025, -0.1));
  group.add(box(0.1, 0.05, 0.3, darker, -0.5, h + 0.025, -0.1));
  const faces: Array<
    [
      number,
      number,
      number,
    ]
  > = [
    [
      0.5,
      -0.25,
      0x53b36a,
    ],
    [
      0.65,
      -0.1,
      0xe24a55,
    ],
    [
      0.35,
      -0.1,
      0xe68bc0,
    ],
    [
      0.5,
      0.05,
      0x5b88dc,
    ],
  ];
  for (const [x, z, color] of faces) {
    group.add(cylinder(0.055, 0.055, 0.06, color, 8, x, h + 0.03, z));
  }
  return {
    group,
    radius: 1.1,
    height: h + 0.14,
  };
}

// ---------------------------------------------------------------- monstera

function leafShape(size: number) {
  const shape = new THREE.Shape();
  const w = size;
  const h = size * 1.3;
  shape.moveTo(0, -h * 0.5);
  shape.lineTo(w * 0.42, -h * 0.3);
  shape.lineTo(w * 0.18, -h * 0.2);
  shape.lineTo(w * 0.5, -h * 0.02);
  shape.lineTo(w * 0.22, h * 0.06);
  shape.lineTo(w * 0.46, h * 0.26);
  shape.lineTo(w * 0.16, h * 0.3);
  shape.lineTo(w * 0.1, h * 0.5);
  shape.lineTo(0, h * 0.4);
  shape.lineTo(-w * 0.1, h * 0.5);
  shape.lineTo(-w * 0.16, h * 0.3);
  shape.lineTo(-w * 0.46, h * 0.26);
  shape.lineTo(-w * 0.22, h * 0.06);
  shape.lineTo(-w * 0.5, -h * 0.02);
  shape.lineTo(-w * 0.18, -h * 0.2);
  shape.lineTo(-w * 0.42, -h * 0.3);
  shape.closePath();
  return shape;
}

function monstera(): ThingModel {
  const group = new THREE.Group();
  const terracotta = 0xbb6a3f;
  const soil = 0x3d2b20;
  const green = 0x3f8d4c;
  const stem = 0x2f6d3b;
  group.add(cylinder(0.46, 0.36, 0.66, terracotta, 10));
  group.add(cylinder(0.52, 0.52, 0.12, terracotta, 10, 0, 0.66 + 0.06, 0));
  group.add(cylinder(0.44, 0.44, 0.04, soil, 10, 0, 0.78 + 0.02, 0));
  const leaves: Array<
    [
      number,
      number,
      number,
      number,
    ]
  > = [
    [
      0.9,
      1.1,
      0.2,
      -0.3,
    ],
    [
      0.8,
      1.5,
      2.3,
      -0.2,
    ],
    [
      0.7,
      1.8,
      4.2,
      -0.45,
    ],
    [
      0.55,
      1.25,
      5.4,
      -0.1,
    ],
  ];
  for (const [size, height, around, lean] of leaves) {
    const length = height - 0.8;
    const stalk = cylinder(0.025, 0.035, length, stem, 5);
    stalk.position.set(0, 0.8, 0);
    stalk.geometry.translate(0, length / 2, 0);
    stalk.rotation.set(lean, around, 0);
    group.add(stalk);
    const leaf = new THREE.Mesh(
      new THREE.ExtrudeGeometry(leafShape(size), {
        depth: 0.03,
        bevelEnabled: false,
      }),
      mat(green),
    );
    const tip = new THREE.Vector3(0, length, 0)
      .applyEuler(new THREE.Euler(lean, around, 0))
      .add(new THREE.Vector3(0, 0.8, 0));
    leaf.position.copy(tip);
    leaf.rotation.set(-Math.PI / 2 + 0.55 + lean, around, 0, "YXZ");
    group.add(leaf);
  }
  return {
    group,
    radius: 1.2,
    height: 2.6,
  };
}

// ------------------------------------------------------------------ pencil

function pencil(): ThingModel {
  const group = new THREE.Group();
  const burgundy = 0x6a2a30;
  const black = 0x1b1b1d;
  const gold = 0xd0a84c;
  const wood = 0xe6c99a;
  const lead = 0x2b2b2e;
  const r = 0.085;
  const length = 2.5;
  const barrel = cylinder(r, r, length, burgundy, 6);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(0, r, 0);
  group.add(barrel);
  const band = cylinder(r * 1.02, r * 1.02, 0.08, gold, 6);
  band.rotation.z = Math.PI / 2;
  band.position.set(-length / 2 + 0.22, r, 0);
  group.add(band);
  const cap = cylinder(r * 1.02, r * 1.02, 0.18, black, 6);
  cap.rotation.z = Math.PI / 2;
  cap.position.set(-length / 2 + 0.09, r, 0);
  group.add(cap);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(r, 0.36, 6), mat(wood));
  tip.rotation.z = -Math.PI / 2;
  tip.position.set(length / 2 + 0.18, r, 0);
  group.add(tip);
  const point = new THREE.Mesh(
    new THREE.ConeGeometry(r * 0.32, 0.14, 6),
    mat(lead),
  );
  point.rotation.z = -Math.PI / 2;
  point.position.set(length / 2 + 0.36 + 0.06, r, 0);
  group.add(point);
  return {
    group,
    radius: 1.45,
    height: r * 2,
  };
}

// ----------------------------------------------------------------- babylon

function babylon(): ThingModel {
  const group = new THREE.Group();
  const amber = 0xc98f3c;
  const glass = 0xe8d7b8;
  const black = 0x1c1c1e;
  const paper = 0xf4efe4;
  group.add(box(0.72, 1.0, 0.36, amber));
  group.add(box(0.72, 0.12, 0.36, glass, 0, 1.06, 0));
  group.add(cylinder(0.12, 0.14, 0.12, glass, 8, 0, 1.12 + 0.06, 0));
  group.add(cylinder(0.2, 0.2, 0.34, black, 8, 0, 1.24 + 0.17, 0));
  group.add(box(0.42, 0.5, 0.02, paper, 0, 0.48, 0.19));
  return {
    group,
    radius: 0.55,
    height: 1.6,
  };
}

export const THINGS: readonly ThingSpec<ThingId>[] = [
  {
    id: "pyramids",
    name: "Pyramids",
    yaw: 0.35,
    build: pyramids,
  },
  {
    id: "burj",
    name: "Burj Khalifa",
    yaw: 0.2,
    build: burj,
  },
  {
    id: "bass",
    name: "Bass",
    yaw: -0.9,
    build: bass,
  },
  {
    id: "keyboard",
    name: "Keyboard",
    yaw: 0.18,
    build: keyboard,
  },
  {
    id: "controller",
    name: "PlayStation",
    yaw: -0.25,
    build: controller,
  },
  {
    id: "monstera",
    name: "Monstera",
    yaw: 0.6,
    build: monstera,
  },
  {
    id: "pencil",
    name: "Pencil",
    yaw: 0.5,
    build: pencil,
  },
  {
    id: "babylon",
    name: "Babylon",
    yaw: -0.3,
    build: babylon,
  },
];
