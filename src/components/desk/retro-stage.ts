import * as THREE from "three";
import {
  disposeThing,
  disposeThingMaterials,
  type ThingId,
  type ThingModel,
  type ThingSpec,
} from "./things-models";

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
};

export type StageOptions = {
  pixelSize: number;
  reducedMotion: boolean;
};

type Body = {
  spec: ThingSpec;
  model: ThingModel;
  shadow: THREE.Mesh;
  home: THREE.Vector3;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  yaw: number;
  yawVel: number;
  tilt: THREE.Vector2;
  held: boolean;
  grounded: boolean;
};

const GRAVITY = 42;
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
uniform sampler2D tDiffuse;
uniform float levels;
varying vec2 vUv;

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
  // Coverage is dithered too: a half-transparent shadow becomes a stipple.
  if (c.a <= t) discard;
  vec3 rgb = c.a > 0.0 ? c.rgb / c.a : c.rgb;
  vec3 srgb = pow(clamp(rgb, 0.0, 1.0), vec3(1.0 / 2.2));
  float steps = levels - 1.0;
  vec3 q = floor(srgb * steps + t) / steps;
  gl_FragColor = vec4(q, 1.0);
}
`;

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

  const camera = new THREE.PerspectiveCamera(28, 1, 1, 200);

  const target = new THREE.WebGLRenderTarget(2, 2, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: true,
    stencilBuffer: false,
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
      levels: {
        value: 6,
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

  // Shadows are dark on a light page and light on a dark one.
  const applyTheme = () => {
    const dark = document.documentElement.classList.contains("dark");
    shadowMaterial.color.set(dark ? 0xffffff : 0x000000);
    shadowMaterial.opacity = dark ? 0.1 : 0.12;
    invalidate();
  };
  const theme = new MutationObserver(applyTheme);
  theme.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [
      "class",
    ],
  });

  const bodies: Body[] = things.map((spec) => {
    const model = spec.build();
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(model.radius * 0.7, 12),
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
      yawVel: 0,
      tilt: new THREE.Vector2(),
      held: false,
      grounded: true,
    };
  });

  // ------------------------------------------------------------ layout

  let width = 1;
  let height = 1;
  let halfWidth = 8;
  let halfDepth = 3;
  let narrow = false;

  function layoutHomes() {
    const count = bodies.length;
    if (!narrow) {
      // One row; the wide things get more room.
      const weights = bodies.map((body) => body.model.radius + 0.9);
      const total = weights.reduce((sum, w) => sum + w, 0);
      let cursor = -halfWidth + 0.6;
      const span = halfWidth * 2 - 1.2;
      bodies.forEach((body, index) => {
        const slot = (weights[index] / total) * span;
        const x = cursor + slot / 2;
        cursor += slot;
        body.home.set(x, 0, (index % 2 === 0 ? 0.6 : -0.7) + (index % 3) * 0.2);
      });
    } else {
      const perRow = Math.ceil(count / 2);
      bodies.forEach((body, index) => {
        const row = index < perRow ? 0 : 1;
        const col = row === 0 ? index : index - perRow;
        const n = row === 0 ? perRow : count - perRow;
        const x = ((col + 0.5) / n) * (halfWidth * 2 - 1) - halfWidth + 0.5;
        body.home.set(x, 0, row === 0 ? -halfDepth * 0.45 : halfDepth * 0.5);
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
    camera.aspect = width / height;
    narrow = camera.aspect < 1.6;
    // The desk is as wide as the view at the far row; the camera backs off
    // until that many units fit.
    halfWidth = narrow ? 6.2 : 8.6;
    halfDepth = narrow ? 3.6 : 2.2;
    const half = THREE.MathUtils.degToRad(camera.fov / 2);
    const distance = (halfWidth + 0.8) / (Math.tan(half) * camera.aspect);
    const elevation = narrow ? 0.62 : 0.5;
    camera.position.set(
      0,
      Math.sin(elevation) * distance + 0.6,
      Math.cos(elevation) * distance,
    );
    camera.lookAt(0, 0.4, 0);
    camera.updateProjectionMatrix();
    layoutHomes();
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
              body.grounded = true;
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
        body.spec.yaw + body.yaw,
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
    // The front edge of the desk, for the line drawn under the things.
    tmp.set(0, 0, halfDepth + 0.4).project(camera);
    canvas.parentElement?.style.setProperty(
      "--desk-edge",
      `${(((1 - tmp.y) / 2) * height).toFixed(1)}px`,
    );
    projected.clear();
    for (const body of bodies) {
      tmp
        .set(body.pos.x, 0, body.pos.z + body.model.radius * 0.55)
        .project(camera);
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
  applyTheme();
  fit();
  // Everything arrives from above, one after another.
  if (!options.reducedMotion) {
    bodies.forEach((body, index) => {
      body.pos.y = 5 + index * 0.9;
      body.vel.set(0, -2, 0);
      body.grounded = false;
      body.yawVel = (index % 2 ? 1 : -1) * 1.4;
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
      theme.disconnect();
      for (const body of bodies) {
        disposeThing(body.model);
        body.shadow.geometry.dispose();
      }
      shadowMaterial.dispose();
      disposeThingMaterials();
      postMaterial.dispose();
      target.dispose();
      renderer.dispose();
    },
  };
  return api;
}

export type RetroStage = ReturnType<typeof createRetroStage>;
