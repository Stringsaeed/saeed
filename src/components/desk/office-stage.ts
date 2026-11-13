import * as THREE from "three";
import { disposeCats } from "./office-cats";
import {
  buildRoom,
  disposeMeshes,
  FIXTURE_PLACEMENT,
  type OfficeModel,
  type OfficeSpec,
  PLACEMENT,
  type Placement,
  ROOM,
} from "./office-models";
import {
  disposeFlatMaterials,
  redraw,
  setPaperTheme,
  snapVertices,
} from "./retro-material";
import { createRetroPass } from "./retro-pass";
import type { StageEvents } from "./retro-stage";

// One room instead of a desk: the things sit where they would in an office,
// on the desk, the shelf and the floor. Pick one up and it comes toward
// you; let go and it hops back to its place. Drag the room itself to turn
// it. Drawn by the same retro pass as the desk, and only when something
// moves.

export type OfficeOptions = {
  pixelSize: number;
  reducedMotion: boolean;
};

type Body = {
  spec: OfficeSpec;
  model: OfficeModel;
  pivot: THREE.Group;
  shadow: THREE.Mesh | null;
  home: THREE.Vector3;
  /** How tall it stands, for the label that floats over it. */
  top: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  yaw: number;
  restYaw: number;
  yawVel: number;
  tilt: THREE.Vector2;
  held: boolean;
  grounded: boolean;
  /** Set when the thing leaves its place, so its landing can be heard. */
  landed: boolean;
  /** Seconds until it drops in, at the start. Out of sight until then. */
  wait: number;
};

const GRAVITY = 42;
const AMBIENT_TICK = 1 / 12;
const TAU = Math.PI * 2;
const NARROW_AT = 700;
/** How far it leans toward a mouse that is only looking. */
const SWAY = 0.05;

// Whoever is looking stands in the room, a few steps back from the desk.
const EYE = {
  height: 4.0,
  /** Where they start, and which way they face: a little down, at the desk. */
  start: {
    x: 0.4,
    z: 7.0,
    yaw: 0,
    pitch: -0.1,
    /** On an upright screen, where the ceiling would otherwise take a fifth. */
    pitchNarrow: -0.24,
  },
  /** How far the head tips up and down. It turns all the way round. */
  up: 0.3,
  down: 0.45,
  /** Units a second on the keys. */
  pace: 5,
};

// The floor they can stand on: the open strip in front of the furniture.
const WALK = {
  minX: ROOM.left + 1.4,
  maxX: ROOM.right - 1.4,
  minZ: 4.1,
  // It stops short of the couch along the wall behind.
  maxZ: ROOM.front - 1.9,
};

const KEYS: Record<
  string,
  readonly [
    number,
    number,
  ]
> = {
  w: [
    0,
    1,
  ],
  arrowup: [
    0,
    1,
  ],
  s: [
    0,
    -1,
  ],
  arrowdown: [
    0,
    -1,
  ],
  a: [
    -1,
    0,
  ],
  arrowleft: [
    -1,
    0,
  ],
  d: [
    1,
    0,
  ],
  arrowright: [
    1,
    0,
  ],
};

function placementOf(id: string): Placement {
  const found =
    (PLACEMENT as Record<string, Placement>)[id] ??
    (FIXTURE_PLACEMENT as Record<string, Placement>)[id];
  if (!found) throw new Error(`No place in the office for: ${id}`);
  return found;
}

export function createOfficeStage(
  canvas: HTMLCanvasElement,
  things: readonly OfficeSpec[],
  events: StageEvents,
  options: OfficeOptions,
) {
  const pass = createRetroPass(canvas);

  const scene = new THREE.Scene();
  const ambientLight = new THREE.HemisphereLight(0xfff6e8, 0x8b7d6b, 2.1);
  scene.add(ambientLight);
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(3, 9, 7);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdbe8ff, 0.7);
  fill.position.set(-6, 3, 4);
  scene.add(fill);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.3, 90);

  const room = buildRoom();
  scene.add(room.group);

  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
  });
  snapVertices(shadowMaterial);

  const hitMaterial = new THREE.MeshBasicMaterial();
  const scratch = new THREE.Box3();
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  const ORIGIN: Placement = {
    at: [
      0,
      0,
      0,
    ],
    yaw: 0,
  };

  const bodies: Body[] = things.map((spec) => {
    const model = spec.build();
    // What walks about places itself; everything else has a spot.
    const place = model.mover ? ORIGIN : placementOf(spec.id);
    const inner = model.group;
    const pivot = new THREE.Group();
    let shadow: THREE.Mesh | null = null;
    if (model.mover) {
      size.set(model.radius * 2, model.height, model.radius * 2);
      center.set(0, model.height / 2, 0);
    } else {
      inner.scale.multiplyScalar(place.scale ?? 1);
      if (place.pitch) inner.rotation.x = place.pitch;
      inner.updateMatrixWorld(true);
      scratch.setFromObject(inner);
      scratch.getSize(size);
      scratch.getCenter(center);
      if (!spec.fixed) {
        // Stand it on its place, footprint centred, so a turn is a turn on
        // the spot.
        inner.position.set(-center.x, -scratch.min.y, -center.z);
        center.set(0, size.y / 2, 0);
      }
    }
    pivot.add(inner);
    // Something to aim at: a pencil is two texels thick.
    const pad = 0.24;
    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(size.x + pad, size.y + pad, size.z + pad),
      hitMaterial,
    );
    hit.position.copy(center);
    hit.visible = false;
    (model.mover ?? pivot).add(hit);

    if (model.mover || !spec.fixed) {
      const radius = model.mover
        ? model.radius * 0.85
        : Math.max(0.2, Math.sqrt(size.x * size.z) * 0.5);
      shadow = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 12),
        shadowMaterial,
      );
      shadow.rotation.x = -Math.PI / 2;
      if (model.mover) {
        // Its shadow goes where it goes.
        shadow.position.y = 0.02;
        model.mover.add(shadow);
      } else {
        scene.add(shadow);
      }
    }
    scene.add(pivot);
    const home = new THREE.Vector3(...place.at);
    return {
      spec,
      model,
      pivot,
      shadow,
      home,
      top: size.y,
      pos: home.clone(),
      vel: new THREE.Vector3(),
      yaw: 0,
      restYaw: place.yaw,
      yawVel: 0,
      tilt: new THREE.Vector2(),
      held: false,
      grounded: true,
      landed: false,
      wait: 0,
    };
  });

  const applyTheme = () => {
    const dark = document.documentElement.classList.contains("dark");
    setPaperTheme(dark);
    room.setTheme(dark);
    // The things keep their colours at night, a little dimmer and cooler.
    ambientLight.intensity = dark ? 1.5 : 2.1;
    ambientLight.color.set(dark ? 0xd8dcff : 0xfff6e8);
    key.intensity = dark ? 1.7 : 2.6;
    shadowMaterial.color.set(dark ? 0xffffff : 0x000000);
    shadowMaterial.opacity = dark ? 0.06 : 0.14;
    pass.setInk(dark ? 0xd6d6dc : 0x1c1c1f);
    invalidate();
  };
  const theme = new MutationObserver(applyTheme);
  theme.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [
      "class",
    ],
  });

  // -------------------------------------------------------------- camera

  let width = 1;
  let height = 1;
  let narrow = false;
  const tmp = new THREE.Vector3();
  /** Where the eye is and where it is going. */
  const eye = new THREE.Vector3(EYE.start.x, EYE.height, EYE.start.z);
  const goal = eye.clone();
  /** Which way the head is turned, where it is turning to, and the lean
   *  of a mouse that is only looking. */
  const look = {
    yaw: EYE.start.yaw,
    pitch: EYE.start.pitch,
  };
  const want = {
    yaw: EYE.start.yaw,
    pitch: EYE.start.pitch,
  };
  const sway = {
    yaw: 0,
    pitch: 0,
  };
  const keysDown = new Set<string>();

  /** Set once the first size is known and the head has been tilted for it. */
  let framed = false;

  function place() {
    camera.position.copy(eye);
    camera.rotation.set(look.pitch, look.yaw, 0, "YXZ");
    camera.updateMatrixWorld();
  }

  function fit() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    narrow = width < NARROW_AT;
    // A phone shows a slice of the room. On its dense screen a texel can
    // be smaller and still land on whole pixels.
    const dpr = window.devicePixelRatio || 1;
    const texel =
      narrow && dpr >= 2 ? Math.floor(1.5 * dpr) / dpr : options.pixelSize;
    pass.setSize(
      Math.max(1, Math.round(width / texel)),
      Math.max(1, Math.round(height / texel)),
    );
    camera.aspect = width / height;
    // Upright screens get a taller view, so the desk still fits across.
    camera.fov = camera.aspect < 1 ? 68 : camera.aspect < 1.5 ? 58 : 52;
    camera.updateProjectionMatrix();
    if (!framed) {
      framed = true;
      want.pitch = look.pitch =
        camera.aspect < 1 ? EYE.start.pitchNarrow : EYE.start.pitch;
    }
    place();
    invalidate();
  }

  // ---------------------------------------------------------- simulation

  const raycaster = new THREE.Raycaster();
  raycaster.params.Line.threshold = 0;
  const ndc = new THREE.Vector2();
  const dragPlane = new THREE.Plane();
  const hit = new THREE.Vector3();
  let held: Body | null = null;
  const grabOffset = new THREE.Vector3();
  let pointerTarget: THREE.Vector3 | null = null;
  let pan: {
    x: number;
    y: number;
    yaw: number;
    pitch: number;
  } | null = null;
  let hovered: Body | null = null;
  let awake = true;
  let inView = true;
  let raf = 0;
  let last = performance.now();
  let disposed = false;
  let ready = false;
  const projected = new Map<
    string,
    {
      x: number;
      y: number;
      z: number;
    }
  >();

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
      const hits = raycaster.intersectObject(body.pivot, true);
      if (hits.length && hits[0].distance < bestDistance) {
        bestDistance = hits[0].distance;
        best = body;
      }
    }
    if (!best) return null;
    // The furniture is in the way of whatever is behind it.
    const blocked = raycaster.intersectObject(room.group, true);
    if (blocked.length && blocked[0].distance < bestDistance - 0.5) return null;
    return best;
  }

  /** Seconds owed to whatever moves by itself: cats, reels, the clapper. */
  let ambient = 0;

  function step(dt: number) {
    let moving = false;

    // Twelve ticks a second, and none while the room is out of sight.
    ambient = Math.min(ambient + dt, AMBIENT_TICK * 3);
    while (ambient >= AMBIENT_TICK) {
      ambient -= AMBIENT_TICK;
      for (const body of bodies) {
        if (body.model.tick?.(AMBIENT_TICK)) moving = true;
      }
    }

    // Walking on the keys, relative to where the head is turned.
    if (keysDown.size) {
      let side = 0;
      let ahead = 0;
      for (const key of keysDown) {
        side += KEYS[key][0];
        ahead += KEYS[key][1];
      }
      const stride = EYE.pace * dt;
      goal.x +=
        (Math.cos(look.yaw) * side - Math.sin(look.yaw) * ahead) * stride;
      goal.z +=
        (-Math.sin(look.yaw) * side - Math.cos(look.yaw) * ahead) * stride;
      goal.x = THREE.MathUtils.clamp(goal.x, WALK.minX, WALK.maxX);
      goal.z = THREE.MathUtils.clamp(goal.z, WALK.minZ, WALK.maxZ);
    }
    const yawTo = want.yaw + sway.yaw;
    const pitchTo = THREE.MathUtils.clamp(
      want.pitch + sway.pitch,
      -EYE.down,
      EYE.up,
    );
    const off =
      Math.abs(yawTo - look.yaw) +
      Math.abs(pitchTo - look.pitch) +
      Math.abs(goal.x - eye.x) +
      Math.abs(goal.z - eye.z);
    if (off > 1e-4) {
      const turn = options.reducedMotion ? 1 : 1 - Math.exp(-14 * dt);
      const walk = options.reducedMotion ? 1 : 1 - Math.exp(-5 * dt);
      look.yaw += (yawTo - look.yaw) * turn;
      look.pitch += (pitchTo - look.pitch) * turn;
      eye.x += (goal.x - eye.x) * walk;
      eye.z += (goal.z - eye.z) * walk;
      if (off < 1e-3) {
        look.yaw = yawTo;
        look.pitch = pitchTo;
        eye.x = goal.x;
        eye.z = goal.z;
      }
      place();
      moving = true;
    }

    for (const body of bodies) {
      if (body.wait > 0) {
        body.wait -= dt;
        if (body.wait <= 0) body.pivot.visible = true;
        moving = true;
        continue;
      }
      if (body.held) {
        if (pointerTarget) {
          // Critically damped pull toward the hand.
          const k = 190;
          const c = 2 * Math.sqrt(k);
          tmp.copy(pointerTarget).add(grabOffset);
          body.vel.x += (k * (tmp.x - body.pos.x) - c * body.vel.x) * dt;
          body.vel.y += (k * (tmp.y - body.pos.y) - c * body.vel.y) * dt;
          body.vel.z += (k * (tmp.z - body.pos.z) - c * body.vel.z) * dt;
        }
        body.pos.addScaledVector(body.vel, dt);
        body.yawVel += body.vel.x * 0.5 * dt;
        body.tilt.x +=
          (-body.vel.z * 0.03 - body.tilt.x) * Math.min(1, 10 * dt);
        body.tilt.y += (body.vel.x * 0.03 - body.tilt.y) * Math.min(1, 10 * dt);
        moving = true;
      } else {
        if (!body.grounded) {
          // In the air it heads for home, and gravity does the rest.
          const k = 70;
          const c = 2 * Math.sqrt(k);
          body.vel.x += (k * (body.home.x - body.pos.x) - c * body.vel.x) * dt;
          body.vel.z += (k * (body.home.z - body.pos.z) - c * body.vel.z) * dt;
          body.vel.y -= GRAVITY * dt;
          body.pos.addScaledVector(body.vel, dt);
          if (body.pos.y <= body.home.y && body.vel.y <= 0) {
            body.pos.y = body.home.y;
            if (body.vel.y < -1.5) {
              body.vel.y = -body.vel.y * 0.3;
              body.yawVel *= 0.6;
            } else {
              body.vel.set(0, 0, 0);
              body.pos.copy(body.home);
              if (body.landed) events.onLand?.(body.spec.id);
              body.grounded = true;
              body.landed = false;
            }
          }
          moving = true;
        }
        body.tilt.x += (0 - body.tilt.x) * Math.min(1, 8 * dt);
        body.tilt.y += (0 - body.tilt.y) * Math.min(1, 8 * dt);
      }
      // A chair is left to spin down before it is straightened.
      const spinning = body.spec.spins && Math.abs(body.yawVel) > 3;
      if (body.grounded && !body.held && !spinning) {
        // Back to facing the way it was put down.
        const rest = Math.round(body.yaw / TAU) * TAU;
        body.yawVel += (-(body.yaw - rest) * 60 - body.yawVel * 10) * dt;
        if (Math.abs(body.yaw - rest) < 1e-3 && Math.abs(body.yawVel) < 1e-2) {
          body.yaw = rest;
          body.yawVel = 0;
        }
      }
      if (Math.abs(body.yawVel) > 1e-3) {
        body.yaw += body.yawVel * dt;
        const drag = body.spec.spins ? 1.5 : body.grounded ? 5 : 1.2;
        body.yawVel *= Math.exp(-drag * dt);
        moving = true;
      } else {
        body.yawVel = 0;
      }
      if (body.tilt.lengthSq() > 1e-6) moving = true;

      body.pivot.position.copy(body.pos);
      body.pivot.rotation.set(
        body.tilt.x,
        body.restYaw + body.yaw,
        body.tilt.y,
        "YXZ",
      );
      if (body.shadow && !body.model.mover) {
        // The shadow stays where the thing belongs and fades as it leaves.
        body.shadow.position.set(body.home.x, body.home.y + 0.02, body.home.z);
        const away = body.pos.distanceTo(body.home);
        body.shadow.scale.setScalar(1 / (1 + away * 0.45));
      }
    }
    return moving;
  }

  function project() {
    projected.clear();
    for (const body of bodies) {
      // The label floats over the top of the thing, where it covers the
      // wall and not a neighbour. The view hangs labels 6px below the
      // point it is given; 20px up leaves the label's own height clear.
      tmp.copy(body.model.mover?.position ?? body.pos);
      tmp.y += body.top;
      tmp.project(camera);
      // Behind the eye there is nowhere to put a label.
      const seen = tmp.z < 1;
      projected.set(body.spec.id, {
        x: seen ? ((tmp.x + 1) / 2) * width : -9999,
        y: seen ? ((1 - tmp.y) / 2) * height - 26 : -9999,
        z: tmp.z,
      });
    }
    events.onProject(projected);
  }

  function render() {
    pass.render(scene, camera);
    project();
    if (!ready) {
      ready = true;
      events.onReady();
    }
  }

  function loop(now: number) {
    if (disposed) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (document.hidden || !inView) return;
    const moving = step(dt);
    if (moving || awake) {
      awake = false;
      render();
    }
  }

  // A finger on something that can be carried holds it; a finger anywhere
  // else scrolls the page.
  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    if (event.touches.length !== 1 || !touch) return;
    const body = pick(touch.clientX, touch.clientY);
    if (body && !body.spec.fixed) event.preventDefault();
  };
  canvas.addEventListener("touchstart", onTouchStart, {
    passive: false,
  });

  // WASD or the arrows walk, once the room has the focus.
  const onKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (!(key in KEYS) || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    event.preventDefault();
    keysDown.add(key);
    invalidate();
  };
  const onKeyUp = (event: KeyboardEvent) => {
    keysDown.delete(event.key.toLowerCase());
  };
  const onBlur = () => keysDown.clear();
  canvas.tabIndex = 0;
  canvas.addEventListener("keydown", onKeyDown);
  canvas.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("blur", onBlur);

  // Space would scroll the page out from under the room. While the room is
  // on screen it does nothing, unless it is pressing a button or a link.
  const onSpace = (event: KeyboardEvent) => {
    if (event.key !== " " || !inView) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (
      target instanceof Element &&
      target !== canvas &&
      target.closest("a, button, input, textarea, select, [contenteditable]")
    ) {
      return;
    }
    event.preventDefault();
  };
  window.addEventListener("keydown", onSpace);

  const resize = new ResizeObserver(() => fit());
  resize.observe(canvas);
  const sight = new IntersectionObserver(([entry]) => {
    inView = entry?.isIntersecting ?? true;
    if (inView) invalidate();
  });
  sight.observe(canvas);
  redraw.add(invalidate);
  applyTheme();
  fit();
  // Everything that can be carried drops into place, one after another,
  // from just under the ceiling.
  if (!options.reducedMotion) {
    let order = 0;
    for (const body of bodies) {
      if (body.spec.fixed) continue;
      body.pos.y = Math.min(body.home.y + 4, ROOM.height - body.top - 0.2);
      body.vel.set(0, -2, 0);
      body.grounded = false;
      body.landed = true;
      body.wait = 0.25 + order * 0.14;
      body.pivot.visible = false;
      body.pivot.position.copy(body.pos);
      order++;
    }
  }
  raf = requestAnimationFrame(loop);

  const api = {
    /** A drag that starts on nothing turns the head. */
    pans: true,
    hover(clientX: number, clientY: number) {
      if (held || pan) return;
      const body = pick(clientX, clientY);
      if (body !== hovered) {
        hovered = body;
        events.onHover(body?.spec.id ?? null);
      }
      if (!options.reducedMotion) {
        sway.yaw = -ndc.x * SWAY;
        sway.pitch = ndc.y * SWAY * 0.5;
        invalidate();
      }
    },
    leave() {
      sway.yaw = 0;
      sway.pitch = 0;
      invalidate();
      if (hovered) {
        hovered = null;
        events.onHover(null);
      }
    },
    /** Starts holding whatever is under the pointer. */
    grab(clientX: number, clientY: number): string | null {
      const body = pick(clientX, clientY);
      // Keys go to the room once it has been touched.
      canvas.focus({
        preventScroll: true,
      });
      // Nothing, or something that stays put: a drag from here turns the
      // head. Only what can be carried is held.
      if (!body || body.spec.fixed) {
        want.yaw = look.yaw;
        want.pitch = look.pitch;
        sway.yaw = 0;
        sway.pitch = 0;
        pan = {
          x: clientX,
          y: clientY,
          yaw: want.yaw,
          pitch: want.pitch,
        };
        return body?.spec.id ?? null;
      }
      held = body;
      body.held = true;
      body.grounded = false;
      // It comes off its place toward the reader, and then follows the
      // pointer across a plane that faces the camera.
      const toward = tmp.copy(camera.position).sub(body.pos).normalize();
      const lifted = body.pos
        .clone()
        .addScaledVector(toward, 1.4)
        .add(new THREE.Vector3(0, 0.3, 0));
      camera.getWorldDirection(hit);
      dragPlane.setFromNormalAndCoplanarPoint(hit.clone(), lifted);
      pointerRay(clientX, clientY);
      const point = raycaster.ray.intersectPlane(dragPlane, hit);
      if (point) {
        grabOffset.copy(lifted).sub(point);
        pointerTarget = point.clone();
      } else {
        grabOffset.set(0, 0, 0);
        pointerTarget = lifted;
      }
      invalidate();
      return body.spec.id;
    },
    move(clientX: number, clientY: number) {
      if (held) {
        pointerRay(clientX, clientY);
        const point = raycaster.ray.intersectPlane(dragPlane, hit);
        if (point) pointerTarget = point.clone();
        return;
      }
      if (pan) {
        // The view follows the hand, as if the room were being dragged.
        const perPixel = THREE.MathUtils.degToRad(camera.fov) / height;
        want.yaw = pan.yaw + (clientX - pan.x) * perPixel;
        want.pitch = THREE.MathUtils.clamp(
          pan.pitch + (clientY - pan.y) * perPixel,
          -EYE.down,
          EYE.up,
        );
        invalidate();
      }
    },
    /** A tap on the floor: walk there, as far as there is floor to stand on. */
    tap(clientX: number, clientY: number) {
      pointerRay(clientX, clientY);
      dragPlane.set(tmp.set(0, 1, 0), 0);
      const point = raycaster.ray.intersectPlane(dragPlane, hit);
      if (!point) return;
      goal.x = THREE.MathUtils.clamp(point.x, WALK.minX, WALK.maxX);
      goal.z = THREE.MathUtils.clamp(point.z, WALK.minZ, WALK.maxZ);
      invalidate();
    },
    release() {
      pan = null;
      if (!held) return;
      held.held = false;
      held.landed = true;
      // Let go below its place and it hops back up instead of sinking.
      const apex = held.home.y + 0.9;
      if (held.pos.y < apex) {
        held.vel.y = Math.max(
          held.vel.y,
          Math.sqrt(2 * GRAVITY * (apex - held.pos.y)),
        );
      }
      held = null;
      pointerTarget = null;
      invalidate();
    },
    /** A tap: a thing hops and turns, furniture does what it does. */
    poke(id: string) {
      const body = bodies.find((candidate) => candidate.spec.id === id);
      if (!body || body.held) return;
      if (body.model.act) {
        body.model.act();
      } else if (body.spec.fixed) {
        if (body.spec.spins && !options.reducedMotion) body.yawVel += 14;
      } else {
        body.vel.y = Math.max(body.vel.y, 9);
        body.yawVel += 5.5;
        body.grounded = false;
        body.landed = true;
      }
      events.onActivate(id);
      invalidate();
    },
    get holding() {
      return held?.spec.id ?? null;
    },
    invalidate,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      resize.disconnect();
      sight.disconnect();
      redraw.delete(invalidate);
      theme.disconnect();
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("blur", onBlur);
      window.removeEventListener("keydown", onSpace);
      for (const body of bodies) {
        disposeMeshes(body.pivot);
        body.model.dispose?.();
        body.shadow?.geometry.dispose();
      }
      room.dispose();
      shadowMaterial.dispose();
      hitMaterial.dispose();
      disposeCats();
      disposeFlatMaterials();
      pass.dispose();
    },
  };
  return api;
}

export type OfficeStage = ReturnType<typeof createOfficeStage>;
