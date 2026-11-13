import * as THREE from "three";
import { film } from "./office-film";
import { flat, glow, paper, redraw, snapVertices } from "./retro-material";
import type { ThingId, ThingModel, ThingSpec } from "./things-models";

// The office the things live in. The room and its furniture are drawn like
// a pen sketch: faces in the page colour, a stipple on the sides turned
// away, and every edge inked. Only the things themselves are in colour.
// Units match things-models; the room is a toy, not a floor plan.

export const ROOM = {
  left: -12,
  right: 7.4,
  back: -4,
  front: 9,
  height: 7.4,
  wall: 0.3,
  desk: 2.8,
  shelf: 5.14,
  /** The top of the low cabinet under the screen. */
  cabinet: 1.1,
} as const;

/** The corner where films are shown: the screen on the back wall and the
 *  projector that faces it. */
export const CINEMA = {
  x: -9.2,
  screen: {
    width: 4.0,
    height: 2.25,
    y: 4.35,
  },
  /** Where the projector stands, and where its lens is. */
  projector: {
    z: 2.0,
    lensY: 2.52,
    lensZ: 1.25,
  },
} as const;

export type OfficeModel = ThingModel & {
  /** What a tap does, for the things that do something. */
  act?: () => void;
  /** Called twelve times a second. Says whether anything moved. */
  tick?: (dt: number) => boolean;
  /** For what walks about by itself: the part that moves. Labels and the
   *  pointer follow it instead of a fixed place. */
  mover?: THREE.Object3D;
  dispose?: () => void;
};

export type OfficeSpec<Id extends string = string> = Omit<
  ThingSpec<Id>,
  "build"
> & {
  build: () => OfficeModel;
  /** Furniture: it can be tapped but not carried off. */
  fixed?: boolean;
  /** A tap turns it, like a swivel chair. */
  spins?: boolean;
};

export type Placement = {
  at: readonly [
    number,
    number,
    number,
  ];
  yaw: number;
  scale?: number;
  /** Tips the model about x before it is stood up: the bass on its stand. */
  pitch?: number;
};

// Where each thing lives. Placed by hand: a pencil and a tower do not
// share a box.
export type PropId = "clapper" | "popcorn";

export const PLACEMENT: Record<ThingId | PropId, Placement> = {
  clapper: {
    at: [
      CINEMA.x - 0.1,
      ROOM.cabinet,
      -3.4,
    ],
    yaw: 0.25,
  },
  popcorn: {
    at: [
      -7.5,
      1.56,
      2.5,
    ],
    yaw: 0.5,
  },
  pyramids: {
    at: [
      3.3,
      ROOM.shelf,
      -3.45,
    ],
    yaw: 0.3,
    scale: 0.72,
  },
  burj: {
    at: [
      5.9,
      0,
      -2.6,
    ],
    yaw: 0.2,
    scale: 0.82,
  },
  monstera: {
    at: [
      -5.3,
      0,
      -2.4,
    ],
    yaw: 0.6,
    scale: 1.45,
  },
  babylon: {
    at: [
      -1.3,
      ROOM.desk,
      -3.0,
    ],
    yaw: -0.3,
  },
  bass: {
    at: [
      -4.3,
      0,
      1.3,
    ],
    yaw: 0.4,
    scale: 1.1,
    pitch: Math.PI / 2 - 0.2,
  },
  keyboard: {
    at: [
      1.0,
      ROOM.desk,
      -1.85,
    ],
    yaw: 0.04,
  },
  controller: {
    at: [
      3.9,
      0.04,
      2.3,
    ],
    yaw: -0.5,
    scale: 1.2,
  },
  pencil: {
    at: [
      3.55,
      ROOM.desk,
      -1.95,
    ],
    yaw: 0.6,
    scale: 0.7,
  },
};

export const FIXTURE_PLACEMENT = {
  computer: {
    at: [
      1.0,
      ROOM.desk,
      -3.1,
    ],
    yaw: 0,
  },
  lamp: {
    at: [
      4.15,
      ROOM.desk,
      -3.45,
    ],
    yaw: 0,
  },
  chair: {
    at: [
      -0.7,
      0,
      1.1,
    ],
    yaw: -1.0,
  },
  projector: {
    at: [
      CINEMA.x,
      0,
      CINEMA.projector.z,
    ],
    yaw: 0,
  },
} as const satisfies Record<string, Placement>;

export type FixtureId = keyof typeof FIXTURE_PLACEMENT;

/** Where the director's chair stands and where the flower cushion lies.
 *  The cats know both. */
export const DIRECTOR = {
  x: -7.5,
  z: 2.5,
  seat: 1.56,
} as const;

export const CUSHION = {
  x: -2.6,
  z: 3.3,
} as const;

// ------------------------------------------------------------ primitives

function inked<T extends THREE.Mesh>(mesh: T, angle = 30) {
  const lines = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, angle),
    paper().line,
  );
  lines.renderOrder = 10;
  mesh.add(lines);
  return mesh;
}

/** A box standing on `y`, with its two side faces in stipple. */
function slab(
  w: number,
  h: number,
  d: number,
  x = 0,
  y = 0,
  z = 0,
  top: "page" | "soft" | "rug" = "page",
) {
  const kit = paper();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [
    kit.tone,
    kit.tone,
    kit[top],
    kit.page,
    kit.page,
    kit.page,
  ]);
  mesh.position.set(x, y + h / 2, z);
  return inked(mesh);
}

type Face = "px" | "nx" | "py" | "ny" | "pz" | "nz";
const FACES: readonly Face[] = [
  "px",
  "nx",
  "py",
  "ny",
  "pz",
  "nz",
];

/** A piece of the room itself: wall-coloured, with some faces told apart. */
function shell(
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  faces: Partial<Record<Face, "shade" | "floor" | "ceiling">>,
) {
  const kit = paper();
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    FACES.map((face) => kit[faces[face] ?? "wall"]),
  );
  mesh.position.set(x, y + h / 2, z);
  return inked(mesh);
}

/** Something upholstered: fabric on every face. */
function cushioned(w: number, h: number, d: number, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), paper().soft);
  mesh.position.set(x, y + h / 2, z);
  return inked(mesh);
}

function tube(
  rTop: number,
  rBottom: number,
  h: number,
  x = 0,
  y = 0,
  z = 0,
  segments = 10,
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBottom, h, segments),
    paper().page,
  );
  mesh.position.set(x, y + h / 2, z);
  // Only the rims are drawn; a line down every facet would be a cage.
  return inked(mesh, 50);
}

/** A thin bar between two points in the xy plane. */
function rod(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  thick: number,
  z = 0,
) {
  const length = Math.hypot(x1 - x0, y1 - y0);
  const mesh = slab(thick, length, thick);
  mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, z);
  mesh.rotation.z = Math.atan2(-(x1 - x0), y1 - y0);
  return mesh;
}

function basic(color: number, opacity = 1) {
  return snapVertices(
    new THREE.MeshBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity >= 1,
    }),
  ) as THREE.MeshBasicMaterial;
}

/** A box in one of the shared colours, standing on `y`. */
function block(
  w: number,
  h: number,
  d: number,
  color: number,
  x = 0,
  y = 0,
  z = 0,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), flat(color));
  mesh.position.set(x, y + h / 2, z);
  return mesh;
}

/** Light is drawn as a mesh, but a pointer goes straight through it. */
function untouchable() {}

export function disposeMeshes(root: THREE.Object3D) {
  root.traverse((node) => {
    if (node instanceof THREE.Mesh || node instanceof THREE.LineSegments) {
      node.geometry.dispose();
    }
  });
}

// ------------------------------------------------------------------ room

export type Room = {
  group: THREE.Group;
  setTheme: (dark: boolean) => void;
  dispose: () => void;
};

/** Walls, floor, and the furniture nobody picks up. */
export function buildRoom(): Room {
  const group = new THREE.Group();
  const { left, right, back, front, height, wall, desk } = ROOM;

  // The shell: a closed room. Whoever is looking stands inside it.
  const outerW = right - left + wall * 2;
  const outerD = front - back + wall * 2;
  const midX = (left + right) / 2;
  const midZ = (back + front) / 2;
  group.add(
    shell(outerW, wall, outerD, midX, -wall, midZ, {
      py: "floor",
    }),
  );
  group.add(
    shell(outerW, wall, outerD, midX, height, midZ, {
      ny: "ceiling",
    }),
  );
  group.add(shell(outerW, height, wall, midX, 0, back - wall / 2, {}));
  group.add(shell(outerW, height, wall, midX, 0, front + wall / 2, {}));
  group.add(
    shell(wall, height, front - back, left - wall / 2, 0, midZ, {
      px: "shade",
    }),
  );
  group.add(
    shell(wall, height, front - back, right + wall / 2, 0, midZ, {
      nx: "shade",
    }),
  );

  // A window in the back wall, and the city behind it: the tall one is the
  // tower I live under.
  const WIN = {
    x: -6.5,
    y: 2.9,
    w: 3.6,
    h: 3.6,
  };
  const sky = basic(0xa1e0ff);
  const sun = basic(0xffbf3d);
  const city = basic(0x8080bf);
  const lamps = basic(0xffd76a);
  // The view is flat cut-outs, one in front of the next. They stand well
  // apart: snapping vertices to the texel grid tilts each one's depth a
  // little, and close layers would cut into each other.
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(WIN.w, WIN.h), sky);
  pane.position.set(WIN.x + WIN.w / 2, WIN.y + WIN.h / 2, back + 0.02);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.4, 12), sun);
  disc.position.set(WIN.x + 0.75, WIN.y + WIN.h - 0.75, back + 0.08);
  disc.renderOrder = 1;
  group.add(pane, disc);
  const towers: Array<
    [
      number,
      number,
      number,
    ]
  > = [
    [
      0.0,
      0.5,
      1.1,
    ],
    [
      0.5,
      0.4,
      1.7,
    ],
    [
      0.9,
      0.55,
      0.9,
    ],
    [
      1.45,
      0.36,
      1.4,
    ],
    [
      1.93,
      0.44,
      1.6,
    ],
    [
      2.03,
      0.24,
      2.4,
    ],
    [
      2.1,
      0.1,
      3.1,
    ],
    [
      2.42,
      0.5,
      1.2,
    ],
    [
      2.92,
      0.3,
      0.8,
    ],
    [
      3.2,
      0.4,
      1.5,
    ],
  ];
  const windows = new THREE.Group();
  towers.forEach(([x, w, h], index) => {
    const tower = new THREE.Mesh(new THREE.PlaneGeometry(w, h), city);
    tower.position.set(WIN.x + x + w / 2, WIN.y + h / 2, back + 0.14);
    tower.renderOrder = 2;
    group.add(tower);
    // A few lit windows each, for the night.
    for (let row = 0; row < Math.floor(h / 0.3); row++) {
      for (let col = 0; col < Math.floor(w / 0.16); col++) {
        if ((row * 7 + col * 5 + index * 3) % 4 !== 0) continue;
        const lit = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.09), lamps);
        lit.position.set(
          WIN.x + x + 0.1 + col * 0.16,
          WIN.y + 0.2 + row * 0.3,
          back + 0.2,
        );
        lit.renderOrder = 3;
        windows.add(lit);
      }
    }
  });
  windows.visible = false;
  group.add(windows);
  const midWin = WIN.x + WIN.w / 2;
  group.add(slab(WIN.w + 0.3, 0.14, 0.34, midWin, WIN.y + WIN.h, back + 0.17));
  group.add(slab(WIN.w + 0.6, 0.14, 0.5, midWin, WIN.y - 0.14, back + 0.25));
  for (const x of [
    WIN.x - 0.07,
    WIN.x + WIN.w + 0.07,
  ]) {
    group.add(slab(0.14, WIN.h, 0.34, x, WIN.y, back + 0.17));
  }
  group.add(slab(0.08, WIN.h, 0.08, midWin, WIN.y, back + 0.28));
  group.add(slab(WIN.w, 0.08, 0.08, midWin, WIN.y + WIN.h * 0.55, back + 0.28));

  // The desk: a top, one slab leg, and a drawer unit.
  const top = 0.18;
  group.add(slab(6.8, top, 2.8, 1.2, desk - top, -2.6));
  group.add(slab(0.18, desk - top, 2.5, -2.0, 0, -2.65));
  group.add(slab(1.6, desk - top, 2.5, 3.7, 0, -2.65));
  for (let i = 0; i < 3; i++) {
    const y = 0.16 + i * 0.82;
    group.add(slab(1.36, 0.68, 0.04, 3.7, y, -1.38));
    group.add(slab(0.3, 0.07, 0.07, 3.7, y + 0.36, -1.33));
  }

  // A shelf over the desk, and a few books that stay put.
  group.add(slab(4.8, 0.14, 1.1, 2.2, ROOM.shelf - 0.14, -3.45));
  group.add(slab(0.1, 0.5, 0.9, 0.3, ROOM.shelf - 0.64, -3.55));
  group.add(slab(0.1, 0.5, 0.9, 4.1, ROOM.shelf - 0.64, -3.55));
  const books: Array<
    [
      number,
      number,
    ]
  > = [
    [
      0.22,
      1.0,
    ],
    [
      0.3,
      1.2,
    ],
    [
      0.2,
      0.9,
    ],
    [
      0.26,
      1.1,
    ],
    [
      0.24,
      0.95,
    ],
  ];
  let cursor = 0.1;
  for (const [thick, tall] of books) {
    group.add(slab(thick, tall, 0.8, cursor + thick / 2, ROOM.shelf, -3.5));
    cursor += thick + 0.02;
  }
  const leaning = slab(0.22, 1.0, 0.8, cursor + 0.32, ROOM.shelf - 0.02, -3.5);
  leaning.rotation.z = 0.42;
  group.add(leaning);

  // A clock between the window and the shelf, set to now.
  const face = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.62, 0.12, 14),
    paper().page,
  );
  face.rotation.x = Math.PI / 2;
  face.position.set(-1.6, 5.75, back + 0.06);
  inked(face, 50);
  group.add(face);
  const now = new Date();
  const minutes = (now.getMinutes() / 60) * Math.PI * 2;
  const hours = ((now.getHours() % 12) / 12) * Math.PI * 2 + minutes / 12;
  const hands = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(Math.sin(minutes) * 0.5, Math.cos(minutes) * 0.5, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(Math.sin(hours) * 0.32, Math.cos(hours) * 0.32, 0),
    ]),
    paper().line,
  );
  hands.renderOrder = 10;
  hands.position.set(-1.6, 5.75, back + 0.14);
  group.add(hands);

  // A rug under the chair.
  group.add(slab(6.4, 0.04, 3.5, 1.0, 0, 1.5, "rug"));

  // The stand the bass leans on.
  const stand = new THREE.Group();
  stand.add(slab(1.3, 0.08, 0.12, 0, 0, 0.35));
  stand.add(slab(0.12, 0.08, 1.1, 0, 0, -0.1));
  stand.add(slab(0.1, 2.7, 0.1, 0, 0.08, -0.6));
  stand.add(slab(0.7, 0.08, 0.3, 0, 2.6, -0.45));
  stand.position.set(-4.3, 0, 1.3);
  stand.rotation.y = 0.4;
  group.add(stand);

  // The cinema. A screen pulled down over the back wall, and under it a
  // cabinet with the reels and the tapes.
  const { screen } = CINEMA;
  const reel = film();
  const lit = snapVertices(
    new THREE.MeshBasicMaterial({
      map: reel.texture,
    }),
  ) as THREE.MeshBasicMaterial;
  const bottom = screen.y - screen.height / 2;
  group.add(
    slab(
      screen.width + 0.12,
      screen.height + 0.12,
      0.04,
      CINEMA.x,
      bottom - 0.06,
      back + 0.03,
    ),
  );
  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(screen.width, screen.height),
    paper().page,
  );
  sheet.position.set(CINEMA.x, screen.y, back + 0.07);
  group.add(sheet);
  const housing = tube(0.16, 0.16, screen.width + 0.5, 0, 0, 0, 8);
  housing.rotation.z = Math.PI / 2;
  housing.position.set(CINEMA.x, bottom + screen.height + 0.2, back + 0.14);
  group.add(housing);
  group.add(
    slab(screen.width + 0.24, 0.1, 0.1, CINEMA.x, bottom - 0.18, back + 0.07),
  );

  // The light from the lens to the four corners of the screen.
  const lens = new THREE.Vector3(
    CINEMA.x,
    CINEMA.projector.lensY,
    CINEMA.projector.lensZ,
  );
  const corners = [
    [
      -1,
      -1,
    ],
    [
      1,
      -1,
    ],
    [
      1,
      1,
    ],
    [
      -1,
      1,
    ],
  ].map(
    ([sx, sy]) =>
      new THREE.Vector3(
        CINEMA.x + (sx * screen.width) / 2,
        screen.y + (sy * screen.height) / 2,
        back + 0.09,
      ),
  );
  const rays: THREE.Vector3[] = [];
  corners.forEach((corner, index) => {
    rays.push(lens, corner, corners[(index + 1) % corners.length]);
  });
  const light = glow(basic(0xfff1c0, 0.13)) as THREE.MeshBasicMaterial;
  light.side = THREE.DoubleSide;
  const beam = new THREE.Mesh(
    new THREE.BufferGeometry().setFromPoints(rays),
    light,
  );
  beam.renderOrder = 5;
  beam.visible = false;
  beam.raycast = untouchable;
  group.add(beam);
  const unwatch = reel.watch((playing) => {
    sheet.material = playing ? lit : paper().page;
    beam.visible = playing;
  });

  group.add(slab(3.8, ROOM.cabinet, 1.0, CINEMA.x, 0, -3.45));
  for (const side of [
    -1,
    1,
  ]) {
    group.add(slab(1.76, 0.86, 0.03, CINEMA.x + side * 0.92, 0.12, -2.94));
    group.add(slab(0.07, 0.24, 0.06, CINEMA.x + side * 0.16, 0.44, -2.9));
  }
  for (let i = 0; i < 3; i++) {
    group.add(
      tube(
        0.46,
        0.46,
        0.13,
        CINEMA.x - 1.32 + (i === 2 ? 0.08 : 0),
        ROOM.cabinet + i * 0.13,
        -3.45,
        12,
      ),
    );
  }
  for (let i = 0; i < 4; i++) {
    group.add(
      slab(
        0.95,
        0.16,
        0.6,
        CINEMA.x + 1.28 + (i % 2 ? 0.05 : -0.03),
        ROOM.cabinet + i * 0.16,
        -3.45,
      ),
    );
  }

  // A director's chair, turned to the screen.
  const seat = new THREE.Group();
  for (const side of [
    -0.6,
    0.6,
  ]) {
    seat.add(rod(-0.55, 0, 0.55, 1.5, 0.07, side));
    seat.add(rod(0.55, 0, -0.55, 1.5, 0.07, side));
    seat.add(slab(0.07, 1.4, 0.07, -0.55, 1.5, side));
    seat.add(slab(1.1, 0.06, 0.12, 0, 2.05, side));
    seat.add(slab(0.07, 0.55, 0.07, 0.5, 1.5, side));
  }
  seat.add(slab(1.15, 0.06, 1.24, 0, 1.5, 0, "soft"));
  seat.add(slab(0.05, 0.5, 1.2, -0.55, 2.35, 0));
  seat.position.set(DIRECTOR.x, 0, DIRECTOR.z);
  seat.rotation.y = 1.87;
  group.add(seat);

  // The cushion the tuxedo sleeps on: a flower, pink.
  const cushion = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const petal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.6, 0.16, 8),
      flat(0xf1c4cc),
    );
    petal.position.set(Math.cos(angle) * 0.62, 0.08, Math.sin(angle) * 0.62);
    cushion.add(petal);
  }
  const heart = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.54, 0.2, 8),
    flat(0xf7efe2),
  );
  heart.position.y = 0.1;
  cushion.add(heart);
  cushion.position.set(CUSHION.x, 0, CUSHION.z);
  group.add(cushion);

  return {
    group,
    setTheme(dark) {
      sky.color.set(dark ? 0x1a1a80 : 0xa1e0ff);
      sun.color.set(dark ? 0xffffbf : 0xffbf3d);
      city.color.set(dark ? 0x00003d : 0x8080bf);
      windows.visible = dark;
    },
    dispose() {
      unwatch();
      reel.dispose();
      disposeMeshes(group);
      sky.dispose();
      sun.dispose();
      city.dispose();
      lamps.dispose();
      lit.dispose();
      light.dispose();
    },
  };
}

// -------------------------------------------------------------- fixtures

const SCREEN_W = 40;
const SCREEN_H = 30;

/** A screen of code, at a size where a line of code is a line. */
function screenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = SCREEN_W;
  canvas.height = SCREEN_H;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "#06220f";
    context.fillRect(0, 0, SCREEN_W, SCREEN_H);
    context.fillStyle = "#62ff8f";
    const lines = [
      [
        2,
        9,
      ],
      [
        4,
        16,
      ],
      [
        4,
        22,
      ],
      [
        6,
        12,
      ],
      [
        4,
        19,
      ],
      [
        2,
        5,
      ],
      [
        2,
        14,
      ],
    ];
    lines.forEach(([indent, length], row) => {
      context.fillRect(indent + 1, 3 + row * 3.5, length, 1.5);
    });
    // The cursor, waiting.
    context.fillRect(18, 3 + lines.length * 3.5 - 3.5, 2, 2.5);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

function computer(): OfficeModel {
  const group = new THREE.Group();
  group.add(slab(1.1, 0.1, 0.9));
  group.add(tube(0.3, 0.36, 0.16, 0, 0.1, 0));
  group.add(slab(2.0, 1.6, 1.3, 0, 0.26, 0));
  group.add(slab(1.4, 1.1, 0.22, 0, 0.5, -0.76));
  group.add(slab(1.72, 1.3, 0.03, 0, 0.45, 0.665));
  group.add(slab(0.12, 0.06, 0.03, 0.72, 0.31, 0.665));
  const texture = screenTexture();
  const on = snapVertices(
    new THREE.MeshBasicMaterial({
      map: texture,
    }),
  ) as THREE.MeshBasicMaterial;
  const off = basic(0x1a1d1b);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), on);
  screen.position.set(0, 1.1, 0.69);
  group.add(screen);
  let lit = true;
  return {
    group,
    radius: 1.1,
    height: 1.86,
    act() {
      lit = !lit;
      screen.material = lit ? on : off;
      for (const fn of redraw) fn();
    },
    dispose() {
      texture.dispose();
      on.dispose();
      off.dispose();
    },
  };
}

function lamp(): OfficeModel {
  const group = new THREE.Group();
  group.add(tube(0.42, 0.46, 0.1));
  group.add(rod(0, 0.1, -0.3, 1.25, 0.07));
  group.add(rod(-0.3, 1.25, -0.9, 1.8, 0.07));
  const headX = -0.95;
  const headZ = 0.2;
  const shade = tube(0.16, 0.46, 0.46, headX, 1.36, headZ, 10);
  group.add(shade);
  // The light itself: a cone of stipple and a pool where it lands.
  const warm = glow(basic(0xf6d04a, 0.3)) as THREE.MeshBasicMaterial;
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.85, 1.36, 12, 1, true),
    warm,
  );
  beam.position.set(headX, 0.68, headZ);
  beam.renderOrder = 5;
  const pool = new THREE.Mesh(new THREE.CircleGeometry(0.85, 14), warm);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(headX, 0.012, headZ);
  pool.renderOrder = 4;
  beam.raycast = untouchable;
  pool.raycast = untouchable;
  const bulb = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.1, 8),
    basic(0xf6d04a),
  );
  bulb.position.set(headX, 1.34, headZ);
  group.add(beam, pool, bulb);
  let lit = true;
  return {
    group,
    radius: 0.9,
    height: 1.9,
    act() {
      lit = !lit;
      beam.visible = lit;
      pool.visible = lit;
      bulb.visible = lit;
      for (const fn of redraw) fn();
    },
    dispose() {
      warm.dispose();
      (bulb.material as THREE.Material).dispose();
    },
  };
}

function chair(): OfficeModel {
  const group = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const leg = slab(0.9, 0.1, 0.14);
    leg.position.set(Math.cos(angle) * 0.45, 0.05, Math.sin(angle) * 0.45);
    leg.rotation.y = -angle;
    group.add(leg);
  }
  group.add(tube(0.09, 0.09, 1.2, 0, 0.1, 0, 8));
  group.add(cushioned(1.7, 0.24, 1.6, 0, 1.3, 0));
  group.add(slab(0.14, 0.9, 0.1, 0, 1.5, 0.85));
  group.add(cushioned(1.6, 1.3, 0.2, 0, 2.0, 0.85));
  return {
    group,
    radius: 1.0,
    height: 3.3,
  };
}

function projector(): OfficeModel {
  const group = new THREE.Group();
  const reel = film();
  // It faces the screen, which is toward -z.
  group.add(slab(1.0, 0.08, 1.0));
  group.add(tube(0.1, 0.12, 1.9, 0, 0.08, 0, 8));
  group.add(slab(1.1, 0.08, 1.5, 0, 1.98, 0));
  group.add(slab(0.5, 0.9, 1.1, 0, 2.06, 0.1));
  const lens = tube(0.15, 0.15, 0.4, 0, 0, 0, 8);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 2.52, -0.6);
  group.add(lens);
  const lit = basic(0xfff1c0);
  const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.13, 8), lit);
  bulb.rotation.y = Math.PI;
  bulb.position.set(0, 2.52, -0.81);
  bulb.visible = false;
  group.add(bulb);
  const reels = [
    [
      3.5,
      -0.35,
    ],
    [
      3.35,
      0.75,
    ],
  ].map(([y, z]) => {
    group.add(rod(0, 2.9, 0, y, 0.08, z));
    const wheel = new THREE.Group();
    const disc = tube(0.5, 0.5, 0.08, 0, -0.04, 0, 12);
    disc.rotation.z = Math.PI / 2;
    disc.position.set(0, 0, 0);
    wheel.add(disc);
    // Spokes, so a turning reel can be seen to turn.
    for (const spoke of [
      slab(0.1, 0.84, 0.08, 0, -0.42, 0),
      slab(0.1, 0.08, 0.84, 0, -0.04, 0),
    ]) {
      wheel.add(spoke);
    }
    wheel.position.set(0.3, y, z);
    group.add(wheel);
    return wheel;
  });
  const unwatch = reel.watch((playing) => {
    bulb.visible = playing;
  });
  return {
    group,
    radius: 0.8,
    height: 4.0,
    act() {
      reel.toggle();
    },
    tick(dt) {
      if (!reel.playing) return false;
      for (const wheel of reels) wheel.rotation.x += 7 * dt;
      reel.tick(dt);
      return true;
    },
    dispose() {
      unwatch();
      lit.dispose();
    },
  };
}

// ----------------------------------------------------------------- props

const SLATE = 0x1f1f24;
const CHALK = 0xf2ecdc;

/** Five blocks, black and white by turns: the striped stick of a slate. */
function sticks(parent: THREE.Object3D, y: number, offset: number) {
  for (let i = 0; i < 5; i++) {
    parent.add(
      block(0.26, 0.15, 0.1, (i + offset) % 2 ? CHALK : SLATE, i * 0.26, y, 0),
    );
  }
}

function clapper(): OfficeModel {
  const group = new THREE.Group();
  group.add(block(1.3, 0.85, 0.08, SLATE));
  for (const y of [
    0.26,
    0.5,
  ]) {
    group.add(block(1.12, 0.03, 0.02, CHALK, 0, y, 0.045));
  }
  group.add(block(0.03, 0.26, 0.02, CHALK, -0.1, 0, 0.045));
  const fixed = new THREE.Group();
  sticks(fixed, 0, 0);
  fixed.position.set(-0.52, 0.85, 0);
  group.add(fixed);
  // The arm is hinged at its left end and waits open.
  const OPEN = 0.5;
  const arm = new THREE.Group();
  sticks(arm, 0, 1);
  for (const child of arm.children) child.position.x += 0.13;
  arm.position.set(-0.65, 1.0, 0);
  arm.rotation.z = OPEN;
  group.add(arm);
  /** Ticks since the tap, or -1 at rest. */
  let clap = -1;
  return {
    group,
    radius: 0.7,
    height: 1.5,
    act() {
      if (clap < 0) clap = 0;
    },
    tick() {
      if (clap < 0) return false;
      // Shut in two ticks, held for five, open again in three.
      if (clap < 2) arm.rotation.z = OPEN * (1 - (clap + 1) / 2);
      else if (clap === 2) film().start();
      else if (clap >= 7) arm.rotation.z = OPEN * Math.min(1, (clap - 6) / 3);
      clap = clap >= 9 ? -1 : clap + 1;
      return true;
    },
  };
}

function popcorn(): OfficeModel {
  const group = new THREE.Group();
  const bucket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.29, 0.72, 4),
    flat(0xcf3a34),
  );
  bucket.rotation.y = Math.PI / 4;
  bucket.position.y = 0.36;
  group.add(bucket);
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.385, 0.345, 0.22, 4),
    flat(CHALK),
  );
  band.rotation.y = Math.PI / 4;
  band.position.y = 0.4;
  group.add(band);
  const kernels: Array<
    [
      number,
      number,
      number,
    ]
  > = [
    [
      -0.14,
      0.72,
      -0.1,
    ],
    [
      0.12,
      0.72,
      -0.12,
    ],
    [
      -0.1,
      0.72,
      0.14,
    ],
    [
      0.14,
      0.72,
      0.1,
    ],
    [
      0,
      0.84,
      0,
    ],
    [
      -0.02,
      0.74,
      -0.02,
    ],
  ];
  kernels.forEach(([x, y, z], index) => {
    group.add(block(0.2, 0.18, 0.2, index % 2 ? 0xfff6d6 : 0xf3dc8c, x, y, z));
  });
  return {
    group,
    radius: 0.45,
    height: 1.0,
  };
}

export const PROPS: readonly OfficeSpec<PropId>[] = [
  {
    id: "clapper",
    name: "Clapperboard",
    yaw: 0,
    build: clapper,
  },
  {
    id: "popcorn",
    name: "Popcorn",
    yaw: 0,
    build: popcorn,
  },
];

export const FIXTURES: readonly OfficeSpec<FixtureId>[] = [
  {
    id: "computer",
    name: "Computer",
    yaw: 0,
    fixed: true,
    build: computer,
  },
  {
    id: "lamp",
    name: "Lamp",
    yaw: 0,
    fixed: true,
    build: lamp,
  },
  {
    id: "chair",
    name: "Chair",
    yaw: 0,
    fixed: true,
    spins: true,
    build: chair,
  },
  {
    id: "projector",
    name: "Projector",
    yaw: 0,
    fixed: true,
    build: projector,
  },
];
