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
  // Clustered so the three cones read as one desk object, not a landscape.
  const spots: Array<
    [
      number,
      number,
      number,
      number,
    ]
  > = [
    [
      0.78,
      1.28,
      -0.06,
      0.1,
    ],
    [
      0.58,
      1.0,
      0.52,
      -0.18,
    ],
    [
      0.36,
      0.62,
      -0.46,
      -0.26,
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
    radius: 1.05,
    height: 1.28,
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

/** A closed outline through points, with each corner rounded off. The
 *  points go round once; the curve passes through the middle of each side. */
function rounded(
  points: ReadonlyArray<
    readonly [
      number,
      number,
    ]
  >,
) {
  const shape = new THREE.Shape();
  const mid = (i: number) => {
    const [ax, ay] = points[i % points.length];
    const [bx, by] = points[(i + 1) % points.length];
    return [
      (ax + bx) / 2,
      (ay + by) / 2,
    ] as const;
  };
  const [startX, startY] = mid(0);
  shape.moveTo(startX, startY);
  for (let i = 1; i <= points.length; i++) {
    const [cx, cy] = points[i % points.length];
    const [x, y] = mid(i);
    shape.quadraticCurveTo(cx, cy, x, y);
  }
  return shape;
}

/** A flat piece cut to an outline, lying on its back: the outline's x is
 *  across, its y runs up the neck (toward -z), and `y` is where it lies. */
function slice(shape: THREE.Shape, thickness: number, color: number, y = 0) {
  const mesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: false,
      curveSegments: 5,
    }),
    mat(color),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  return mesh;
}

// My bass: a Precision in blue, white guard, maple neck. It lies on its
// back with the neck running away from the body, toward -z. Along its
// length, 0 is the strap button at the bottom and about 3.95 the tip of
// the headstock; across, the long horn and the tuners are on the left.
function bass(): ThingModel {
  const group = new THREE.Group();
  const blue = 0x3f97cd;
  const white = 0xf4f3ee;
  const maple = 0xe6c98f;
  const black = 0x1f1f24;
  const chrome = 0xd6d6dc;
  const thick = 0.17;
  /** Where the body's middle sits, so the whole thing turns about it. */
  const centre = 0.6;
  const parts = new THREE.Group();
  parts.position.z = centre;

  // The body: two horns, the long one on the bass side, and a waist.
  parts.add(
    slice(
      rounded([
        [
          0,
          -0.04,
        ],
        [
          0.62,
          0.02,
        ],
        [
          0.6,
          0.62,
        ],
        [
          0.4,
          0.86,
        ],
        [
          0.56,
          1.18,
        ],
        [
          0.46,
          1.46,
        ],
        [
          0.2,
          1.3,
        ],
        [
          0.15,
          1.1,
        ],
        [
          -0.15,
          1.14,
        ],
        [
          -0.2,
          1.42,
        ],
        [
          -0.5,
          1.84,
        ],
        [
          -0.66,
          1.3,
        ],
        [
          -0.42,
          0.84,
        ],
        [
          -0.66,
          0.5,
        ],
        [
          -0.6,
          0.0,
        ],
      ]),
      thick,
      blue,
    ),
  );

  // The guard: from beside the neck, under the strings, down to the knobs.
  parts.add(
    slice(
      rounded([
        [
          -0.2,
          1.32,
        ],
        [
          -0.36,
          1.5,
        ],
        [
          -0.4,
          1.12,
        ],
        [
          -0.22,
          0.78,
        ],
        [
          -0.06,
          0.52,
        ],
        [
          0.26,
          0.14,
        ],
        [
          0.52,
          0.1,
        ],
        [
          0.52,
          0.56,
        ],
        [
          0.34,
          0.86,
        ],
        [
          0.46,
          1.16,
        ],
        [
          0.38,
          1.3,
        ],
        [
          0.2,
          1.2,
        ],
      ]),
      0.014,
      white,
      thick,
    ),
  );

  const top = thick + 0.014;
  /** A box on the body: across, along the length, then size. */
  const on = (
    w: number,
    h: number,
    d: number,
    color: number,
    across: number,
    along: number,
    y = top,
  ) => {
    const piece = box(w, h, d, color, across, y + h / 2, -along);
    parts.add(piece);
    return piece;
  };

  // The split pickup: the half under the low strings sits nearer the neck.
  on(0.2, 0.05, 0.1, black, -0.095, 0.86);
  on(0.2, 0.05, 0.1, black, 0.095, 0.74);
  // Bridge, with a saddle for each string.
  on(0.36, 0.035, 0.22, chrome, 0, 0.27, thick);
  for (let i = 0; i < 4; i++) {
    on(0.05, 0.06, 0.09, chrome, (i - 1.5) * 0.075, 0.3, thick);
  }
  // Two knobs and the jack, on the guard's lower corner.
  for (const [across, along] of [
    [
      0.36,
      0.5,
    ],
    [
      0.42,
      0.33,
    ],
  ]) {
    parts.add(
      cylinder(0.06, 0.06, 0.07, chrome, 10, across, top + 0.035, -along),
    );
  }
  parts.add(cylinder(0.035, 0.035, 0.03, chrome, 8, 0.44, top + 0.015, -0.17));

  // The neck: maple, dots and frets, from the body to the nut.
  const heel = 1.08;
  const nut = 3.28;
  const neckY = thick - 0.02;
  on(0.2, 0.08, nut - heel, maple, 0, (heel + nut) / 2, neckY);
  const board = neckY + 0.08;
  // Frets crowd together toward the body, as on the real thing.
  const scale = nut - 0.3;
  for (let fret = 1; fret <= 20; fret++) {
    const along = nut - scale * (1 - 2 ** (-fret / 12));
    if (along < heel + 0.04) break;
    on(0.2, 0.012, 0.014, chrome, 0, along, board);
    const dots: Record<number, number[]> = {
      3: [
        0,
      ],
      5: [
        0,
      ],
      7: [
        0,
      ],
      9: [
        0,
      ],
      12: [
        -0.05,
        0.05,
      ],
      15: [
        0,
      ],
      17: [
        0,
      ],
    };
    const before = nut - scale * (1 - 2 ** (-(fret - 1) / 12));
    for (const across of dots[fret] ?? []) {
      parts.add(
        cylinder(
          0.022,
          0.022,
          0.008,
          black,
          6,
          across,
          board + 0.004,
          -(along + before) / 2,
        ),
      );
    }
  }
  on(0.2, 0.02, 0.03, white, 0, nut, board);

  // The headstock leans to the bass side, where the four tuners are.
  parts.add(
    slice(
      rounded([
        [
          0.1,
          nut - 0.02,
        ],
        [
          0.11,
          nut + 0.2,
        ],
        [
          0.19,
          nut + 0.36,
        ],
        [
          0.12,
          nut + 0.56,
        ],
        [
          -0.08,
          nut + 0.7,
        ],
        [
          -0.26,
          nut + 0.6,
        ],
        [
          -0.25,
          nut + 0.14,
        ],
        [
          -0.1,
          nut - 0.02,
        ],
      ]),
      0.07,
      maple,
      neckY,
    ),
  );
  const head = neckY + 0.07;
  for (let i = 0; i < 4; i++) {
    const along = nut + 0.14 + i * 0.135;
    const across = -0.13 + i * 0.012;
    // The post the string winds on, and the key that turns it.
    parts.add(
      cylinder(0.03, 0.03, 0.06, chrome, 8, across, head + 0.03, -along),
    );
    on(0.16, 0.025, 0.025, chrome, across - 0.16, along, head - 0.045);
    on(0.07, 0.02, 0.12, chrome, across - 0.27, along, head - 0.045);
    // And the string itself, from the bridge to the post by way of the nut.
    const at = (i - 1.5) * 0.075;
    const narrow = (i - 1.5) * 0.045;
    const length = nut - 0.3;
    const string = on(
      0.012,
      0.012,
      length,
      chrome,
      (at + narrow) / 2,
      0.3 + length / 2,
      board + 0.02,
    );
    string.rotation.y = Math.atan2(at - narrow, length);
  }

  group.add(parts);
  return {
    group,
    radius: 1.9,
    height: thick + 0.12,
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

// The grey one, with the old console's four colours on its buttons.
function controller(): ThingModel {
  const group = new THREE.Group();
  const grey = 0x9b9eab;
  const pad = 0xb3b6c1;
  const dark = 0x55586a;
  const darker = 0x33353f;
  const h = 0.26;
  group.add(box(1.5, h, 0.56, grey));
  for (const side of [
    -1,
    1,
  ]) {
    const grip = box(0.36, h, 0.9, grey, side * 0.58, h / 2, 0.32);
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
  // The touch pad in the middle, and the darker band between the sticks.
  group.add(box(0.52, 0.03, 0.3, pad, 0, h + 0.015, -0.12));
  group.add(box(0.7, 0.02, 0.2, dark, 0, h + 0.01, 0.16));
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

// My pencil: a silver mechanical one. It lies along x with the lead at +x
// and the eraser cap at -x. From the cap: a clip on the upper barrel, a
// chrome ring, a fatter lower barrel, a knurled grip with an orange dot,
// then a stepped chrome cone down to the lead.
function pencil(): ThingModel {
  const group = new THREE.Group();
  const silver = 0xbfc4ca;
  const knurl = 0xe1e3e5;
  const groove = 0x9a9fa6;
  const chrome = 0xd9dce0;
  const steel = 0x3a3c40;
  const cap = 0xeef0ef;
  const orange = 0xe2573a;
  const r = 0.09;
  /** Every piece sits at this height, so the fattest one rests on the desk. */
  const lie = 0.115;
  // Each piece: radius at the cap end, radius at the lead end, length, colour.
  const pieces: Array<
    [
      number,
      number,
      number,
      number,
    ]
  > = [
    [
      0.115,
      0.115,
      0.2,
      cap,
    ],
    [
      0.06,
      0.06,
      0.08,
      chrome,
    ],
    [
      r,
      r,
      1.0,
      silver,
    ],
    [
      r + 0.008,
      r + 0.008,
      0.08,
      chrome,
    ],
    [
      r + 0.01,
      r + 0.01,
      0.5,
      silver,
    ],
    // The grip: three knurled bands with a groove between each.
    [
      r + 0.01,
      r + 0.01,
      0.16,
      knurl,
    ],
    [
      r,
      r,
      0.02,
      groove,
    ],
    [
      r + 0.01,
      r + 0.01,
      0.16,
      knurl,
    ],
    [
      r,
      r,
      0.02,
      groove,
    ],
    [
      r + 0.01,
      r + 0.01,
      0.16,
      knurl,
    ],
    [
      r + 0.01,
      r - 0.005,
      0.06,
      chrome,
    ],
    [
      0.08,
      0.05,
      0.14,
      chrome,
    ],
    [
      0.045,
      0.03,
      0.1,
      chrome,
    ],
    [
      0.018,
      0.018,
      0.1,
      steel,
    ],
    [
      0.01,
      0.004,
      0.05,
      steel,
    ],
  ];
  const length = pieces.reduce((sum, piece) => sum + piece[2], 0);
  let x = -length / 2;
  /** Where the last knurled band is, for the dot. */
  let dotAt = 0;
  pieces.forEach(([towardCap, towardLead, long, color], index) => {
    // A cylinder's top is turned to face +x, the lead end.
    const piece = cylinder(towardLead, towardCap, long, color, 10);
    piece.rotation.z = -Math.PI / 2;
    piece.position.set(x + long / 2, lie, 0);
    group.add(piece);
    if (index === 9) dotAt = x + long / 2;
    x += long;
  });
  // The orange dot on the grip, turned up so it can be seen.
  group.add(
    cylinder(0.032, 0.032, 0.012, orange, 8, dotAt, lie + r + 0.012, 0),
  );
  // The clip: a band round the barrel near the cap, and the flat spring.
  const clipFrom = -length / 2 + 0.32;
  const band = cylinder(r + 0.012, r + 0.012, 0.07, chrome, 10);
  band.rotation.z = -Math.PI / 2;
  band.position.set(clipFrom, lie, 0);
  group.add(band);
  group.add(box(0.62, 0.022, 0.07, silver, clipFrom + 0.3, lie + r + 0.035, 0));
  group.add(box(0.05, 0.04, 0.07, silver, clipFrom, lie + r + 0.02, 0));
  return {
    group,
    radius: 1.45,
    height: lie * 2,
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
