import * as THREE from "three";
import {
  CINEMA,
  CUSHION,
  type OfficeModel,
  type OfficeSpec,
} from "./office-models";
import { paper, snapVertices } from "./retro-material";

// The two cats, Sono and Bosha. They walk the room along paths that miss the furniture,
// and every so often one sits, loafs, or flops on its side and sleeps.
// They move twelve times a second, like everything else that moves by
// itself here, and nothing is drawn while both are asleep.

export type CatId = "orange" | "tuxedo";

type Pose = "walk" | "stand" | "sit" | "loaf" | "sleep";
type Rest = Exclude<Pose, "walk" | "stand">;

type Spot = {
  x: number;
  z: number;
  /** How it may rest here, if it may. */
  rest?: readonly Rest[];
  /** Which way it faces when it rests; otherwise roughly at the reader. */
  face?: number;
  /** Height of whatever it lies on. */
  y?: number;
};

// Open floor, and the straight walks between that touch nothing.
const SPOTS: readonly Spot[] = [
  {
    // In front of the projector, watching the screen.
    x: -10.8,
    z: 0.6,
    rest: [
      "sit",
    ],
    face: Math.atan2(CINEMA.x + 10.8, -4 - 0.6),
  },
  {
    x: -8.6,
    z: -1.5,
    rest: [
      "sit",
      "loaf",
    ],
    face: Math.PI,
  },
  {
    x: -6.4,
    z: -1.0,
  },
  {
    // Under the window.
    x: -3.4,
    z: -2.7,
    rest: [
      "loaf",
      "sleep",
    ],
  },
  {
    x: -2.9,
    z: -0.4,
  },
  {
    // Under the desk.
    x: 0.4,
    z: -2.5,
    rest: [
      "loaf",
      "sleep",
    ],
  },
  {
    x: -0.9,
    z: -0.7,
  },
  {
    x: 2.2,
    z: -0.4,
    rest: [
      "sit",
      "loaf",
    ],
  },
  {
    x: 5.6,
    z: 0.0,
    rest: [
      "sit",
    ],
  },
  {
    x: 5.9,
    z: 3.6,
    rest: [
      "loaf",
      "sleep",
    ],
  },
  {
    x: 1.6,
    z: 3.8,
    rest: [
      "sit",
      "loaf",
    ],
  },
  {
    // The flower cushion.
    x: CUSHION.x,
    z: CUSHION.z,
    y: 0.17,
    rest: [
      "sleep",
      "loaf",
    ],
  },
  {
    x: -6.0,
    z: 3.9,
  },
  {
    x: -10.6,
    z: 3.5,
    rest: [
      "loaf",
    ],
  },
  // Out on the open floor, toward whoever is looking.
  {
    x: -6.6,
    z: 6.4,
    rest: [
      "sit",
      "loaf",
    ],
  },
  {
    x: -1.4,
    z: 6.0,
    rest: [
      "sit",
    ],
  },
  {
    x: 4.6,
    z: 6.3,
    rest: [
      "sit",
      "loaf",
      "sleep",
    ],
  },
];

const PATHS: ReadonlyArray<
  readonly [
    number,
    number,
  ]
> = [
  [
    0,
    1,
  ],
  [
    0,
    13,
  ],
  [
    1,
    2,
  ],
  [
    2,
    4,
  ],
  [
    4,
    3,
  ],
  [
    4,
    6,
  ],
  [
    6,
    5,
  ],
  [
    6,
    7,
  ],
  [
    7,
    8,
  ],
  [
    8,
    9,
  ],
  [
    9,
    10,
  ],
  [
    10,
    11,
  ],
  [
    11,
    12,
  ],
  [
    12,
    13,
  ],
  [
    4,
    11,
  ],
  [
    2,
    12,
  ],
  [
    7,
    10,
  ],
  [
    12,
    14,
  ],
  [
    14,
    15,
  ],
  [
    15,
    16,
  ],
  [
    10,
    15,
  ],
  [
    11,
    15,
  ],
  [
    9,
    16,
  ],
  [
    10,
    16,
  ],
];

const NEXT: number[][] = SPOTS.map(() => []);
for (const [a, b] of PATHS) {
  NEXT[a].push(b);
  NEXT[b].push(a);
}

/** Spots a cat is on or heading for, so the two never share one. */
const taken = new Map<number, CatId>();

const TICK = 1 / 12;
const SPEED = 2.1;
const SCALE = 1.2;
/** Facing the reader, give or take. */
const TOWARD_READER = 0.45;

type Coat = {
  back: number;
  chest: number;
  legs: number;
  paws: number;
  head: number;
  muzzle: number;
  tail: number;
  tip: number;
  eyes: number;
  /** Tabby rings round the back, or none. */
  rings?: number;
  /** A white stripe up the forehead. */
  blaze?: number;
  /** A white bib under the chin. */
  bib?: number;
};

const COATS: Record<CatId, Coat> = {
  orange: {
    back: 0xdc8a3c,
    chest: 0xf4eee2,
    legs: 0xf4eee2,
    paws: 0xf4eee2,
    head: 0xdc8a3c,
    muzzle: 0xf4eee2,
    tail: 0xdc8a3c,
    tip: 0xb9682a,
    eyes: 0x4a3524,
    rings: 0xb9682a,
    blaze: 0xf4eee2,
  },
  tuxedo: {
    back: 0x2a2a30,
    chest: 0x2a2a30,
    legs: 0x2a2a30,
    paws: 0xf4eee2,
    head: 0x2a2a30,
    muzzle: 0xf4eee2,
    tail: 0x2a2a30,
    tip: 0x2a2a30,
    eyes: 0xd9c33c,
    bib: 0xf4eee2,
  },
};

const NOSE = 0xe79aa2;

const fur = new Map<number, THREE.MeshLambertMaterial>();

/** Like the shared flat colours, but a hair behind its own drawn edges. */
function coat(color: number) {
  let material = fur.get(color);
  if (!material) {
    material = snapVertices(
      new THREE.MeshLambertMaterial({
        color,
        flatShading: true,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
    ) as THREE.MeshLambertMaterial;
    fur.set(color, material);
  }
  return material;
}

/** A box centred on a point, with or without its edges inked. */
function box(
  w: number,
  h: number,
  d: number,
  color: number,
  x: number,
  y: number,
  z: number,
  ink = true,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), coat(color));
  mesh.position.set(x, y, z);
  if (ink) {
    const lines = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry),
      paper().line,
    );
    lines.renderOrder = 10;
    mesh.add(lines);
  }
  return mesh;
}

type Rig = {
  root: THREE.Group;
  body: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  tail: THREE.Group;
  /** Front left, front right, hind left, hind right. */
  legs: THREE.Group[];
};

/** A cat out of boxes, nose toward +z, standing on y = 0. */
function buildRig(colors: Coat): Rig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.scale.setScalar(SCALE);
  root.add(body);

  const torso = new THREE.Group();
  torso.position.set(0, 0.45, -0.5);
  torso.add(box(0.5, 0.45, 0.76, colors.back, 0, 0.225, 0.38));
  torso.add(box(0.5, 0.45, 0.34, colors.chest, 0, 0.225, 0.93));
  if (colors.rings !== undefined) {
    for (const z of [
      0.16,
      0.36,
      0.56,
    ]) {
      torso.add(box(0.52, 0.47, 0.07, colors.rings, 0, 0.225, z, false));
    }
  }
  if (colors.bib !== undefined) {
    torso.add(box(0.3, 0.34, 0.06, colors.bib, 0, 0.19, 1.11, false));
    torso.add(box(0.3, 0.05, 0.9, colors.bib, 0, -0.01, 0.6, false));
  }

  const head = new THREE.Group();
  head.position.set(0, 0.52, 1.2);
  head.add(box(0.5, 0.42, 0.42, colors.head, 0, 0, 0));
  for (const side of [
    -1,
    1,
  ]) {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, 0.22, 4),
      coat(colors.head),
    );
    ear.rotation.y = Math.PI / 4;
    ear.position.set(side * 0.15, 0.31, -0.06);
    head.add(ear);
    head.add(
      box(0.08, 0.08, 0.03, colors.eyes, side * 0.12, 0.05, 0.215, false),
    );
  }
  head.add(box(0.28, 0.17, 0.08, colors.muzzle, 0, -0.12, 0.22, false));
  head.add(box(0.08, 0.06, 0.03, NOSE, 0, -0.05, 0.27, false));
  if (colors.blaze !== undefined) {
    head.add(box(0.1, 0.26, 0.03, colors.blaze, 0, 0.09, 0.212, false));
  }
  torso.add(head);

  const tail = new THREE.Group();
  tail.position.set(0, 0.36, 0.02);
  const base = box(0.12, 0.12, 0.46, colors.tail, 0, 0.1, -0.2);
  base.rotation.x = 0.5;
  tail.add(base);
  tail.add(box(0.12, 0.4, 0.12, colors.tail, 0, 0.42, -0.42));
  tail.add(box(0.12, 0.16, 0.12, colors.tip, 0, 0.7, -0.42));
  torso.add(tail);
  body.add(torso);

  const legs = [
    [
      -0.16,
      0.42,
    ],
    [
      0.16,
      0.42,
    ],
    [
      -0.16,
      -0.4,
    ],
    [
      0.16,
      -0.4,
    ],
  ].map(([x, z]) => {
    const leg = new THREE.Group();
    leg.position.set(x, 0.45, z);
    leg.add(box(0.15, 0.28, 0.15, colors.legs, 0, -0.14, 0));
    leg.add(box(0.15, 0.17, 0.15, colors.paws, 0, -0.365, 0));
    body.add(leg);
    return leg;
  });

  return {
    root,
    body,
    torso,
    head,
    tail,
    legs,
  };
}

/** Puts the boxes where the pose has them. `stride` is the walk cycle. */
function pose(rig: Rig, name: Pose, stride: number) {
  const { body, torso, head, tail, legs } = rig;
  body.rotation.set(0, 0, 0);
  body.position.set(0, 0, 0);
  torso.position.set(0, 0.45, -0.5);
  torso.rotation.set(0, 0, 0);
  head.position.set(0, 0.52, 1.2);
  head.rotation.set(0, 0, 0);
  tail.rotation.set(0, 0, 0);
  legs.forEach((leg, index) => {
    leg.visible = true;
    leg.position.y = 0.45;
    leg.position.z = index < 2 ? 0.42 : -0.4;
    leg.rotation.set(0, 0, 0);
  });
  if (name === "walk") {
    const swing = Math.sin(stride) * 0.55;
    legs[0].rotation.x = swing;
    legs[3].rotation.x = swing;
    legs[1].rotation.x = -swing;
    legs[2].rotation.x = -swing;
    torso.position.y = 0.45 + Math.abs(Math.cos(stride)) * 0.03;
    tail.rotation.y = Math.sin(stride * 0.5) * 0.3;
  } else if (name === "sit") {
    // Rump on the floor, chest up, front legs straight under it.
    torso.position.set(0, 0.2, -0.35);
    torso.rotation.x = -0.8;
    head.rotation.x = 0.8;
    tail.rotation.set(-0.1, 0.9, 0);
    legs[2].visible = false;
    legs[3].visible = false;
    legs[0].position.set(-0.16, 0.5, 0.3);
    legs[1].position.set(0.16, 0.5, 0.3);
  } else if (name === "loaf") {
    // Everything tucked under: a loaf.
    torso.position.y = 0.02;
    head.position.set(0, 0.42, 1.16);
    tail.rotation.set(-0.9, 1.25, 0);
    for (const leg of legs) leg.visible = false;
  } else if (name === "sleep") {
    // Flat on one side with the legs out.
    body.rotation.z = 1.42;
    body.position.set(0.5, 0.3 * SCALE, 0);
    tail.rotation.x = -0.75;
    head.rotation.x = 0.25;
    legs[0].rotation.x = 0.5;
    legs[1].rotation.x = 0.3;
    legs[2].rotation.x = -0.5;
    legs[3].rotation.x = -0.25;
  }
}

function between(low: number, high: number) {
  return low + Math.random() * (high - low);
}

const REST_FOR: Record<
  Rest,
  readonly [
    number,
    number,
  ]
> = {
  sit: [
    3,
    8,
  ],
  loaf: [
    9,
    20,
  ],
  sleep: [
    16,
    34,
  ],
};

type CatOptions = {
  id: CatId;
  /** Where it starts, and whether it starts asleep there. */
  start: number;
  asleep: boolean;
  /** The spot it keeps going back to. */
  favourite: number;
  reducedMotion: boolean;
};

function createCat(options: CatOptions): OfficeModel {
  const rig = buildRig(COATS[options.id]);
  const spot = SPOTS[options.start];
  rig.root.position.set(spot.x, spot.y ?? 0, spot.z);

  let at = options.start;
  let heading: number | null = null;
  let state: Pose = "stand";
  let timer = 0;
  let stride = 0;
  let yaw = spot.face ?? TOWARD_READER;
  let face = yaw;
  /** Ticks left of a startled hop. */
  let hop = 0;
  taken.set(at, options.id);

  function rest(kind: Rest, seconds?: number) {
    state = kind;
    const [low, high] = REST_FOR[kind];
    timer = seconds ?? between(low, high);
    face = SPOTS[at].face ?? TOWARD_READER + between(-0.7, 0.7);
  }

  function leave() {
    // Mostly anywhere free, but it drifts back toward its favourite spot.
    const free = NEXT[at].filter((index) => !taken.has(index));
    if (!free.length) {
      rest("sit", 2);
      return;
    }
    let next = free[Math.floor(Math.random() * free.length)];
    if (Math.random() < 0.35) {
      const goal = SPOTS[options.favourite];
      next = free.reduce((best, index) =>
        Math.hypot(SPOTS[index].x - goal.x, SPOTS[index].z - goal.z) <
        Math.hypot(SPOTS[best].x - goal.x, SPOTS[best].z - goal.z)
          ? index
          : best,
      );
    }
    heading = next;
    taken.set(next, options.id);
    state = "walk";
  }

  function arrive() {
    if (heading === null) return;
    taken.delete(at);
    at = heading;
    heading = null;
    const here = SPOTS[at];
    const stay = at === options.favourite ? 0.85 : 0.45;
    if (here.rest && Math.random() < stay) {
      rest(here.rest[Math.floor(Math.random() * here.rest.length)]);
    } else {
      leave();
    }
  }

  function apply() {
    pose(rig, state, stride);
    rig.root.rotation.y = yaw;
    if (hop > 0) rig.body.position.y += Math.sin((hop / 4) * Math.PI) * 0.5;
  }

  if (options.asleep || options.reducedMotion) {
    const here = SPOTS[at].rest ?? [
      "sit",
    ];
    rest(options.asleep ? "sleep" : here[0], options.asleep ? 7 : undefined);
    yaw = face;
  } else {
    leave();
  }
  apply();

  return {
    group: rig.root,
    mover: rig.root,
    radius: 0.75,
    height: 1.25,
    act() {
      if (options.reducedMotion) return;
      hop = 4;
      if (state === "walk") {
        // Stopped mid-walk: it sits and looks at whoever did that.
        if (heading !== null) taken.delete(heading);
        heading = null;
        rest("sit", 3);
        face = TOWARD_READER;
      } else {
        timer = 0.4;
      }
    },
    tick() {
      if (options.reducedMotion) return false;
      let changed = hop > 0;
      if (hop > 0) hop--;
      if (state === "walk" && heading !== null) {
        const to = SPOTS[heading];
        const from = SPOTS[at];
        const root = rig.root.position;
        const dx = to.x - root.x;
        const dz = to.z - root.z;
        const left = Math.hypot(dx, dz);
        const stepSize = SPEED * TICK;
        if (left <= stepSize) {
          root.set(to.x, to.y ?? 0, to.z);
          arrive();
        } else {
          root.x += (dx / left) * stepSize;
          root.z += (dz / left) * stepSize;
          // Up onto the cushion, or down off it, over the last half step.
          const gone = Math.hypot(root.x - from.x, root.z - from.z);
          const up = (to.y ?? 0) * Math.max(0, 1 - left / 0.7);
          const down = (from.y ?? 0) * Math.max(0, 1 - gone / 0.7);
          root.y = Math.max(up, down);
          face = Math.atan2(dx, dz);
          stride += 1.15;
        }
        changed = true;
      } else {
        timer -= TICK;
        if (timer <= 0) {
          if (state === "stand") leave();
          else {
            // Up on its feet for a moment before it goes.
            state = "stand";
            timer = 0.5;
          }
          changed = true;
        }
      }
      // Turns a little each tick rather than snapping round.
      const turn =
        THREE.MathUtils.euclideanModulo(face - yaw + Math.PI, Math.PI * 2) -
        Math.PI;
      if (Math.abs(turn) > 0.01) {
        yaw += THREE.MathUtils.clamp(turn, -0.5, 0.5);
        changed = true;
      }
      if (changed) apply();
      return changed;
    },
    dispose() {
      taken.delete(at);
      if (heading !== null) taken.delete(heading);
    },
  };
}

/** Releases what the cats share, once the office is gone. */
export function disposeCats() {
  for (const material of fur.values()) material.dispose();
  fur.clear();
  taken.clear();
}

function prefersStillness() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** The cats, as two more things in the office. With reduced motion they
 *  stay where they are, resting. */
export const CATS: readonly OfficeSpec<CatId>[] = [
  {
    id: "orange",
    name: "Sono",
    yaw: 0,
    fixed: true,
    build: () =>
      createCat({
        id: "orange",
        start: 7,
        asleep: false,
        favourite: 3,
        reducedMotion: prefersStillness(),
      }),
  },
  {
    id: "tuxedo",
    name: "Bosha",
    yaw: 0,
    fixed: true,
    build: () =>
      createCat({
        id: "tuxedo",
        start: 11,
        asleep: true,
        favourite: 11,
        reducedMotion: prefersStillness(),
      }),
  },
];
