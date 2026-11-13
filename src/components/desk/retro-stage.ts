import * as THREE from "three";
import { lowRes, redraw, snapVertices } from "./retro-material";
import {
  disposeThing,
  disposeThingMaterials,
  type ThingModel,
  type ThingSpec,
} from "./things-models";

type ThingId = string;

// A desk with things on it, drawn the way a 1997 console would: a few
// pixels per inch, flat colours, Bayer-dithered shading, and dithered
// shadows. The things are real bodies: pick one up, turn it, drop it and it
// lands. Everything renders on demand.

export type StageEvents = {
  onHover: (id: ThingId | null) => void;
  onActivate: (id: ThingId) => void;
  /** Screen positions, in CSS pixels, of the foot of each thing. */
  onProject: (
    positions: Map<
      ThingId,
      {
        x: number;
        y: number;
        z: number;
      }
    >,
  ) => void;
  onReady: () => void;
  /** A thing has come to rest on the desk after being in the air. */
  onLand?: (id: ThingId) => void;
};

export type StageOptions = {
  pixelSize: number;
  reducedMotion: boolean;
  /** Rows of things on a wide desk and on a narrow one. */
  rows: {
    wide: number;
    narrow: number;
  };
  /** Room between things, in desk units, added to each footprint. */
  spacing?: number;
  /**
   * Equal slots. Each thing is scaled into one shared box, long objects
   * lie the same way, and the camera keeps the whole desk in frame.
   * The shelf leaves this off and keeps the weighted rows below.
   */
  grid?: boolean;
};

type Body = {
  spec: ThingSpec;
  model: ThingModel;
  shadow: THREE.Mesh;
  home: THREE.Vector3;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  yaw: number;
  /** Resting turn about y. The grid sets one family; the shelf uses spec.yaw. */
  restYaw: number;
  yawVel: number;
  tilt: THREE.Vector2;
  held: boolean;
  grounded: boolean;
  /** Set when the thing leaves the desk, so its landing can be heard. */
  landed: boolean;
};

const GRAVITY = 42;
const TAU = Math.PI * 2;
const HOLD_HEIGHT = 1.6;

const DITHER_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const DITHER_FRAG = /* glsl */ `
precision highp float;
#include <packing>
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform vec2 texel;
uniform float levels;
uniform float cameraNear;
uniform float cameraFar;
uniform vec3 ink;
varying vec2 vUv;

float viewDepth(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  return -perspectiveDepthToViewZ(d, cameraNear, cameraFar);
}

float bayer(vec2 p) {
  int x = int(mod(p.x, 4.0));
  int y = int(mod(p.y, 4.0));
  int i = x + y * 4;
  // The 4×4 ordered-dither matrix, flattened.
  float m[16];
  m[0] = 0.0; m[1] = 8.0; m[2] = 2.0; m[3] = 10.0;
  m[4] = 12.0; m[5] = 4.0; m[6] = 14.0; m[7] = 6.0;
  m[8] = 3.0; m[9] = 11.0; m[10] = 1.0; m[11] = 9.0;
  m[12] = 15.0; m[13] = 7.0; m[14] = 13.0; m[15] = 5.0;
  for (int k = 0; k < 16; k++) if (k == i) return (m[k] + 0.5) / 16.0;
  return 0.5;
}

void main() {
  vec4 c = texture2D(tDiffuse, vUv);
  float t = bayer(gl_FragCoord.xy);
  // A drawn line where the depth jumps: the edge of a thing against the
  // desk, or the desk against the page.
  float here = viewDepth(vUv);
  float dl = viewDepth(vUv - vec2(texel.x, 0.0));
  float dr = viewDepth(vUv + vec2(texel.x, 0.0));
  float dd = viewDepth(vUv - vec2(0.0, texel.y));
  float du = viewDepth(vUv + vec2(0.0, texel.y));
  float jump = max(max(dl - here, dr - here), max(dd - here, du - here));
  bool edge = jump > 0.45 + here * 0.012;
  // Coverage is dithered too: a half-transparent shadow becomes a stipple.
  if (c.a <= t && !edge) discard;
  vec3 rgb = c.a > 0.0 ? c.rgb / c.a : c.rgb;
  vec3 srgb = pow(clamp(rgb, 0.0, 1.0), vec3(1.0 / 2.2));
  float steps = levels - 1.0;
  vec3 q = floor(srgb * steps + t) / steps;
  if (edge) q = ink;
  gl_FragColor = vec4(q, 1.0);
}
`;

// One cubby for every thing. Footprint and height are capped to the same
// box, then a needle is widened and a flat cluster is given a little height
// so both still read at this pixel size.
const GRID_CELL = 2.2;
const GRID_GAP = 0.64;
const GRID_PAD_X = 0.74;
const GRID_PAD_BACK = 1.85;
const GRID_PAD_FRONT = 0.64;
const GRID_HEIGHT = 1.92;
const GRID_ROOM = GRID_CELL - 0.28;
const GRID_NARROW_AT = 700;
/** Shared turn so every object presents the same face to the camera. */
const GRID_YAW = 0.36;

function fitGridModel(model: ThingModel) {
  const group = model.group;
  group.position.set(0, 0, 0);
  group.rotation.set(0, 0, 0);
  group.scale.set(1, 1, 1);
  group.updateMatrixWorld(true);
  const local = new THREE.Box3().setFromObject(group);
  const center = local.getCenter(new THREE.Vector3());
  const shift = new THREE.Vector3(-center.x, -local.min.y, -center.z);
  for (const child of group.children) {
    child.position.add(shift);
  }
  group.updateMatrixWorld(true);
  const aligned = new THREE.Box3().setFromObject(group);
  const alignedSize = aligned.getSize(new THREE.Vector3());
  // Lay the long axis across the desk, then add the shared turn.
  const restYaw =
    (alignedSize.z > alignedSize.x * 1.25 ? -Math.PI / 2 : 0) + GRID_YAW;
  group.rotation.y = restYaw;
  group.updateMatrixWorld(true);
  const turned = new THREE.Box3().setFromObject(group);
  const size = turned.getSize(new THREE.Vector3());
  const footprint = Math.max(size.x, size.z, 1e-4);
  const scaleXZ = GRID_ROOM / footprint;
  const scaleY = GRID_HEIGHT / Math.max(size.y, 1e-4);
  const uniform = Math.min(scaleXZ, scaleY);
  let xz = uniform;
  let y = uniform;
  const footAfter = footprint * uniform;
  const heightAfter = size.y * uniform;
  // The tower's shaft would be a pixel wide if it only grew in height.
  if (heightAfter > footAfter * 2.6) {
    xz = Math.min(
      scaleXZ,
      uniform * Math.min(2.2, (heightAfter * 0.7) / footAfter),
    );
  }
  // The pyramids are a low cluster. A little extra height keeps them in the set.
  if (size.y > 0.45 && footAfter > heightAfter * 3) {
    y = Math.min(
      scaleY,
      uniform * Math.min(2.2, (footAfter * 0.62) / heightAfter),
    );
  }
  group.scale.set(xz, y, xz);
  group.rotation.set(0, 0, 0);
  model.radius = 0.5 * footprint * xz;
  model.height = size.y * y;
  const hx = Math.max(size.x * xz * 0.5, 0.05);
  const hz = Math.max(size.z * xz * 0.5, 0.05);
  return {
    restYaw,
    shadowRadius: Math.max(0.14, Math.sqrt(hx * hz) * 0.9),
  };
}

export function createRetroStage(
  canvas: HTMLCanvasElement,
  things: readonly ThingSpec[],
  events: StageEvents,
  options: StageOptions,
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    premultipliedAlpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x8b7d6b, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(-5, 9, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdbe8ff, 0.7);
  fill.position.set(6, 3, -4);
  scene.add(fill);

  const camera = new THREE.PerspectiveCamera(28, 1, 4, 120);

  const depthTexture = new THREE.DepthTexture(2, 2);
  depthTexture.minFilter = THREE.NearestFilter;
  depthTexture.magFilter = THREE.NearestFilter;
  const target = new THREE.WebGLRenderTarget(2, 2, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: true,
    stencilBuffer: false,
    depthTexture,
  });
  const postScene = new THREE.Scene();
  const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postMaterial = new THREE.ShaderMaterial({
    vertexShader: DITHER_VERT,
    fragmentShader: DITHER_FRAG,
    uniforms: {
      tDiffuse: {
        value: target.texture,
      },
      tDepth: {
        value: depthTexture,
      },
      texel: {
        value: new THREE.Vector2(1 / 2, 1 / 2),
      },
      levels: {
        value: 5,
      },
      cameraNear: {
        value: 1,
      },
      cameraFar: {
        value: 200,
      },
      ink: {
        value: new THREE.Color(0x1c1c1f),
      },
    },
    depthTest: false,
    depthWrite: false,
    transparent: true,
  });
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMaterial));

  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  });
  snapVertices(shadowMaterial);

  // The desk itself: a slab the things stand on, coloured for the page.
  const slabMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });
  snapVertices(slabMaterial);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), slabMaterial);
  scene.add(slab);

  // Shadows are dark on a light page and light on a dark one.
  const applyTheme = () => {
    const dark = document.documentElement.classList.contains("dark");
    shadowMaterial.color.set(dark ? 0xffffff : 0x000000);
    shadowMaterial.opacity = dark ? 0.05 : 0.14;
    slabMaterial.color.set(dark ? 0x000000 : 0xffffff);
    postMaterial.uniforms.ink.value.set(dark ? 0xd6d6dc : 0x1c1c1f);
    invalidate();
  };
  const theme = new MutationObserver(applyTheme);
  theme.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [
      "class",
    ],
  });

  const grid = options.grid ?? false;

  const bodies: Body[] = things.map((spec) => {
    const model = spec.build();
    const fitted = grid ? fitGridModel(model) : null;
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(
        fitted ? fitted.shadowRadius : model.radius * 0.7,
        12,
      ),
      shadowMaterial,
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.005;
    scene.add(model.group, shadow);
    return {
      spec,
      model,
      shadow,
      home: new THREE.Vector3(),
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      yaw: 0,
      restYaw: fitted?.restYaw ?? spec.yaw,
      yawVel: 0,
      tilt: new THREE.Vector2(),
      held: false,
      grounded: true,
      landed: false,
    };
  });

  // ------------------------------------------------------------ layout

  let width = 1;
  let height = 1;
  let halfWidth = 8;
  let halfDepth = 3;
  let narrow = false;

  function layoutGrid() {
    const rowCount = Math.max(
      1,
      narrow ? options.rows.narrow : options.rows.wide,
    );
    const cols = Math.max(1, Math.ceil(bodies.length / rowCount));
    const width =
      cols * GRID_CELL + Math.max(0, cols - 1) * GRID_GAP + GRID_PAD_X * 2;
    const depth =
      rowCount * GRID_CELL +
      Math.max(0, rowCount - 1) * GRID_GAP +
      GRID_PAD_BACK +
      GRID_PAD_FRONT;
    halfWidth = width / 2;
    halfDepth = depth / 2;
    for (let index = 0; index < bodies.length; index++) {
      const body = bodies[index];
      const row = Math.floor(index / cols);
      const col = index % cols;
      const count = Math.min(cols, bodies.length - row * cols);
      const rowSpan = count * GRID_CELL + Math.max(0, count - 1) * GRID_GAP;
      const x = -rowSpan / 2 + GRID_CELL / 2 + col * (GRID_CELL + GRID_GAP);
      // Row 0 is the far row. The camera sits on +z.
      const z =
        -halfDepth +
        GRID_PAD_BACK +
        GRID_CELL / 2 +
        row * (GRID_CELL + GRID_GAP);
      body.home.set(x, 0, z);
      if (body.held) continue;
      body.pos.x = x;
      body.pos.z = z;
      body.vel.x = 0;
      body.vel.z = 0;
    }
  }

  function frameGrid() {
    const elevation = narrow ? 1.2 : 0.84;
    const lookY = 0.34;
    const yTop = GRID_HEIGHT + 0.16;
    const margin = narrow ? 0.86 : 0.9;
    const corner = new THREE.Vector3();
    const place = (distance: number) => {
      camera.position.set(
        0,
        lookY + Math.sin(elevation) * distance,
        Math.cos(elevation) * distance,
      );
      camera.lookAt(0, lookY, 0);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
    };
    const inside = (distance: number) => {
      place(distance);
      for (const x of [
        -halfWidth,
        halfWidth,
      ]) {
        for (const y of [
          0,
          yTop,
        ]) {
          for (const z of [
            -halfDepth,
            halfDepth,
          ]) {
            corner.set(x, y, z).project(camera);
            if (corner.z < -1 || corner.z > 1) return false;
            if (Math.abs(corner.x) > margin || Math.abs(corner.y) > margin) {
              return false;
            }
          }
        }
      }
      return true;
    };
    let lo = 6;
    let hi = 36;
    while (!inside(hi) && hi < 220) hi *= 1.4;
    for (let step = 0; step < 18; step++) {
      const mid = (lo + hi) / 2;
      if (inside(mid)) hi = mid;
      else lo = mid;
    }
    place(hi);
    postMaterial.uniforms.cameraNear.value = camera.near;
    postMaterial.uniforms.cameraFar.value = camera.far;
  }

  function layoutHomes() {
    const rows = narrow ? options.rows.narrow : options.rows.wide;
    const spacing = options.spacing ?? 0.9;
    const perRow = Math.ceil(bodies.length / rows);
    for (let row = 0; row < rows; row++) {
      const members = bodies.slice(row * perRow, (row + 1) * perRow);
      if (!members.length) continue;
      // Each row shares its width by footprint, so wide things get room.
      const weights = members.map((body) => body.model.radius + spacing);
      const total = weights.reduce((sum, w) => sum + w, 0);
      const span = halfWidth * 2 - 1.2;
      let cursor = -halfWidth + 0.6;
      // Row 0 is the front row.
      const z =
        rows === 1 ? 0 : halfDepth - ((row + 0.5) / rows) * halfDepth * 2;
      members.forEach((body, index) => {
        const slot = (weights[index] / total) * span;
        body.home.set(
          cursor + slot / 2,
          0,
          z + (rows === 1 ? (index % 2 === 0 ? 0.5 : -0.6) : 0),
        );
        cursor += slot;
      });
    }
    // A new layout is a resize: the things simply stand where they belong.
    for (const body of bodies) {
      if (body.held) continue;
      body.pos.x = body.home.x;
      body.pos.z = body.home.z;
      body.vel.x = 0;
      body.vel.z = 0;
    }
  }

  function fit() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    const lw = Math.max(1, Math.round(width / options.pixelSize));
    const lh = Math.max(1, Math.round(height / options.pixelSize));
    renderer.setSize(lw, lh, false);
    target.setSize(lw, lh);
    lowRes.value.set(lw, lh);
    postMaterial.uniforms.texel.value.set(1 / lw, 1 / lh);
    camera.aspect = width / height;
    if (grid) {
      narrow = width < GRID_NARROW_AT;
      layoutGrid();
      frameGrid();
      slab.scale.set(halfWidth * 2, 0.04, halfDepth * 2);
      slab.position.set(0, -0.02, 0);
    } else {
      narrow = camera.aspect < 1.6;
      // The desk is as wide as the view at the far row; the camera backs off
      // until that many units fit.
      const rows = narrow ? options.rows.narrow : options.rows.wide;
      halfWidth = narrow ? 6.2 : 8.2;
      halfDepth = rows === 1 ? 1.6 : 1.2 + rows * 1.3;
      const half = THREE.MathUtils.degToRad(camera.fov / 2);
      const distance = (halfWidth + 0.8) / (Math.tan(half) * camera.aspect);
      const elevation = narrow ? 0.7 : 0.58;
      camera.position.set(
        0,
        Math.sin(elevation) * distance + 0.6,
        Math.cos(elevation) * distance,
      );
      camera.lookAt(0, 0.1, 0);
      camera.updateProjectionMatrix();
      postMaterial.uniforms.cameraNear.value = camera.near;
      postMaterial.uniforms.cameraFar.value = camera.far;
      slab.scale.set(halfWidth * 2 + 1.6, 0.04, halfDepth * 2 + 1.8);
      slab.position.set(0, -0.02, -0.2);
      layoutHomes();
    }
    invalidate();
  }

  // ---------------------------------------------------------- simulation

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  let held: Body | null = null;
  let grabOffset = new THREE.Vector3();
  let hovered: Body | null = null;
  let awake = true;
  let frame = 0;
  let last = performance.now();
  let disposed = false;
  let ready = false;
  const projected = new Map<
    ThingId,
    {
      x: number;
      y: number;
      z: number;
    }
  >();
  const tmp = new THREE.Vector3();

  function invalidate() {
    awake = true;
  }

  function pointerRay(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
  }

  function pick(clientX: number, clientY: number): Body | null {
    pointerRay(clientX, clientY);
    let best: Body | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const body of bodies) {
      const hits = raycaster.intersectObject(body.model.group, true);
      if (hits.length && hits[0].distance < bestDistance) {
        bestDistance = hits[0].distance;
        best = body;
      }
    }
    return best;
  }

  function pointOnPlane(clientX: number, clientY: number, y: number) {
    pointerRay(clientX, clientY);
    plane.constant = -y;
    return raycaster.ray.intersectPlane(plane, hit) ? hit : null;
  }

  function step(dt: number) {
    let moving = false;
    for (const body of bodies) {
      if (body.held) {
        const point = pointerTarget;
        if (point) {
          tmp.copy(point).add(grabOffset);
          tmp.y = HOLD_HEIGHT;
          // Critically damped pull toward the hand.
          const k = 190;
          const c = 2 * Math.sqrt(k);
          body.vel.x += (k * (tmp.x - body.pos.x) - c * body.vel.x) * dt;
          body.vel.y += (k * (tmp.y - body.pos.y) - c * body.vel.y) * dt;
          body.vel.z += (k * (tmp.z - body.pos.z) - c * body.vel.z) * dt;
        }
        body.pos.addScaledVector(body.vel, dt);
        body.yawVel += body.vel.x * 0.9 * dt;
        body.tilt.x +=
          (-body.vel.z * 0.03 - body.tilt.x) * Math.min(1, 10 * dt);
        body.tilt.y += (body.vel.x * 0.03 - body.tilt.y) * Math.min(1, 10 * dt);
        body.grounded = false;
        moving = true;
      } else {
        if (
          !body.grounded ||
          body.pos.y > 0.001 ||
          body.vel.lengthSq() > 1e-4
        ) {
          body.vel.y -= GRAVITY * dt;
          body.pos.addScaledVector(body.vel, dt);
          if (body.pos.y <= 0) {
            body.pos.y = 0;
            if (body.vel.y < -1.5) {
              body.vel.y = -body.vel.y * 0.3;
              body.vel.x *= 0.7;
              body.vel.z *= 0.7;
              body.yawVel *= 0.6;
            } else {
              body.vel.y = 0;
              if (!body.grounded && body.landed) events.onLand?.(body.spec.id);
              body.grounded = true;
              body.landed = false;
            }
          }
          const friction = body.pos.y <= 0 ? Math.exp(-6 * dt) : 1;
          body.vel.x *= friction;
          body.vel.z *= friction;
          moving = true;
        }
        // Things that slid off the desk come back.
        const limitX = halfWidth - body.model.radius * 0.5;
        const limitZ = halfDepth;
        if (Math.abs(body.pos.x) > limitX) {
          body.vel.x += (Math.sign(body.pos.x) * limitX - body.pos.x) * 30 * dt;
          body.grounded = false;
        }
        if (Math.abs(body.pos.z) > limitZ) {
          body.vel.z += (Math.sign(body.pos.z) * limitZ - body.pos.z) * 30 * dt;
          body.grounded = false;
        }
        body.tilt.x += (0 - body.tilt.x) * Math.min(1, 8 * dt);
        body.tilt.y += (0 - body.tilt.y) * Math.min(1, 8 * dt);
      }
      if ((grid || body.spec.settle) && body.grounded && !body.held) {
        // Shelved things turn back to face the front.
        const turns = Math.round(body.yaw / TAU);
        const rest = turns * TAU;
        body.yawVel += (-(body.yaw - rest) * 60 - body.yawVel * 10) * dt;
        if (Math.abs(body.yaw - rest) < 1e-3 && Math.abs(body.yawVel) < 1e-2) {
          body.yaw = rest;
          body.yawVel = 0;
        }
      }
      if (Math.abs(body.yawVel) > 1e-3) {
        body.yaw += body.yawVel * dt;
        body.yawVel *= Math.exp(-(body.grounded ? 5 : 1.2) * dt);
        moving = true;
      } else {
        body.yawVel = 0;
      }
      if (body.tilt.lengthSq() > 1e-6) moving = true;

      const group = body.model.group;
      group.position.copy(body.pos);
      group.rotation.set(
        body.tilt.x,
        body.restYaw + body.yaw,
        body.tilt.y,
        "YXZ",
      );
      body.shadow.position.set(body.pos.x, 0.005, body.pos.z);
      const lift = 1 / (1 + body.pos.y * 0.45);
      body.shadow.scale.setScalar(lift);
    }
    // Things on the desk nudge each other apart instead of stacking.
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j];
        const dx = b.pos.x - a.pos.x;
        const dz = b.pos.z - a.pos.z;
        const gap = (a.model.radius + b.model.radius) * 0.55;
        const dist = Math.hypot(dx, dz);
        if (dist >= gap || dist < 1e-4) continue;
        const push = ((gap - dist) / gap) * 24 * dt;
        const nx = dx / dist;
        const nz = dz / dist;
        if (!a.held) {
          a.vel.x -= nx * push;
          a.vel.z -= nz * push;
          a.grounded = false;
        }
        if (!b.held) {
          b.vel.x += nx * push;
          b.vel.z += nz * push;
          b.grounded = false;
        }
        moving = true;
      }
    }
    return moving;
  }

  function project() {
    projected.clear();
    for (const body of bodies) {
      const lead = grid
        ? Math.min(body.model.radius * 0.35, 0.28)
        : body.model.radius * 0.55;
      tmp.set(body.pos.x, 0, body.pos.z + lead).project(camera);
      projected.set(body.spec.id, {
        x: ((tmp.x + 1) / 2) * width,
        y: ((1 - tmp.y) / 2) * height,
        z: tmp.z,
      });
    }
    events.onProject(projected);
  }

  function render() {
    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(postScene, postCamera);
    project();
    if (!ready) {
      ready = true;
      events.onReady();
    }
  }

  let pointerTarget: THREE.Vector3 | null = null;

  function loop(now: number) {
    if (disposed) return;
    frame = requestAnimationFrame(loop);
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (document.hidden) return;
    const moving = step(dt);
    if (moving || awake) {
      awake = false;
      render();
    }
  }

  const resize = new ResizeObserver(() => fit());
  resize.observe(canvas);
  redraw.add(invalidate);
  applyTheme();
  fit();
  // Everything arrives from above, one after another.
  if (!options.reducedMotion) {
    bodies.forEach((body, index) => {
      body.pos.y = 5 + index * 0.9;
      body.vel.set(0, -2, 0);
      body.grounded = false;
      body.landed = true;
      body.yawVel = body.spec.settle || grid ? 0 : (index % 2 ? 1 : -1) * 1.4;
    });
  }
  frame = requestAnimationFrame(loop);

  const api = {
    hover(clientX: number, clientY: number) {
      if (held) return;
      const body = pick(clientX, clientY);
      if (body !== hovered) {
        hovered = body;
        events.onHover(body?.spec.id ?? null);
      }
    },
    leave() {
      if (hovered) {
        hovered = null;
        events.onHover(null);
      }
    },
    /** Starts holding whatever is under the pointer. */
    grab(clientX: number, clientY: number): ThingId | null {
      const body = pick(clientX, clientY);
      if (!body) return null;
      held = body;
      body.held = true;
      body.grounded = false;
      const point = pointOnPlane(clientX, clientY, HOLD_HEIGHT);
      grabOffset = point
        ? new THREE.Vector3(body.pos.x - point.x, 0, body.pos.z - point.z)
        : new THREE.Vector3();
      pointerTarget = point ? point.clone() : body.pos.clone();
      body.vel.y = Math.max(body.vel.y, 3);
      invalidate();
      return body.spec.id;
    },
    move(clientX: number, clientY: number) {
      if (!held) return;
      const point = pointOnPlane(clientX, clientY, HOLD_HEIGHT);
      if (point) pointerTarget = point.clone();
    },
    release() {
      if (!held) return;
      held.held = false;
      held.grounded = false;
      held.landed = true;
      held = null;
      pointerTarget = null;
      invalidate();
    },
    /** A tap: the thing hops and turns. */
    poke(id: ThingId) {
      const body = bodies.find((candidate) => candidate.spec.id === id);
      if (!body || body.held) return;
      body.vel.y = Math.max(body.vel.y, 9);
      body.yawVel += 5.5;
      body.grounded = false;
      body.landed = true;
      events.onActivate(id);
      invalidate();
    },
    get holding() {
      return held?.spec.id ?? null;
    },
    invalidate,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      redraw.delete(invalidate);
      theme.disconnect();
      for (const body of bodies) {
        disposeThing(body.model);
        body.shadow.geometry.dispose();
      }
      shadowMaterial.dispose();
      slab.geometry.dispose();
      slabMaterial.dispose();
      depthTexture.dispose();
      disposeThingMaterials();
      postMaterial.dispose();
      target.dispose();
      renderer.dispose();
    },
  };
  return api;
}

export type RetroStage = ReturnType<typeof createRetroStage>;
