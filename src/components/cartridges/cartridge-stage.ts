import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { ProjectLinkType } from "@/data/projects";
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
  /** The link elements for each cartridge, in the order of its links. The
   *  stage keeps each one over the sticker that is drawn for it. */
  links: ReadonlyMap<string, readonly HTMLElement[]>;
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
  /** Pointer position over the slot, -1 to 1 each way. */
  aim: THREE.Vector2;
  /** Draws the label again: when its icon or its typeface arrives. */
  paint: () => void;
  /** One per link: the drawn sticker, its link element, and how far it
   *  has popped up under the pointer. */
  stickers: Array<{
    mesh: THREE.Mesh;
    link: HTMLElement;
    pop: Spring;
  }>;
  disposables: Array<{
    dispose: () => void;
  }>;
};

const TAU = Math.PI * 2;
const FOV = 16;
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

/** The label: the app's icon and name on a cream card, like a title screen. */
function drawLabel(
  context: CanvasRenderingContext2D,
  cartridge: Cartridge,
  icon: HTMLImageElement | null,
  font: string,
) {
  const { px, py } = LABEL;
  context.fillStyle = cartridge.brand;
  context.fillRect(0, 0, px, py);
  context.fillStyle = "#f6f0e1";
  roundRect(context, 12, 12, px - 24, py - 24, 18);
  context.fill();

  const size = 236;
  const left = (px - size) / 2;
  const top = 50;
  if (icon) {
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
  context.fillStyle = "#1b1b1f";
  let type = 46;
  context.font = `${type}px ${font}`;
  const name = cartridge.name.toUpperCase();
  while (type > 22 && context.measureText(name).width > px - 70) {
    type -= 2;
    context.font = `${type}px ${font}`;
  }
  context.fillText(name, px / 2, 368);
  context.fillStyle = "#8a8474";
  context.font = `22px ${font}`;
  context.fillText(
    cartridge.kind === "shipped" ? "SHIPPED" : "SIDE PROJECT",
    px / 2,
    428,
  );
}

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

/** A sticker: a white rounded square with one icon on it. */
function stickerTexture(type: ProjectLinkType, anisotropy: number) {
  const size = 160;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "#fffdf7";
    roundRect(context, 6, 6, size - 12, size - 12, 40);
    context.fill();
    context.strokeStyle = "rgba(0, 0, 0, 0.14)";
    context.lineWidth = 3;
    context.stroke();
    context.fillStyle = "#1b1b1f";
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
    back: new RoundedBoxGeometry(0.84, 0.52, 0.02, 5, 0.036),
    shadow: new THREE.PlaneGeometry(1.25, 0.3),
  };
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

  function build(cartridge: Cartridge, slot: HTMLElement): Item {
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
    let icon: HTMLImageElement | null = null;
    const paint = () => {
      if (!context || disposed) return;
      drawLabel(context, cartridge, icon, font);
      texture.needsUpdate = true;
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
    const add = (
      shape: THREE.BufferGeometry,
      material: THREE.Material,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new THREE.Mesh(shape, material);
      mesh.position.set(x, y, z);
      body.add(mesh);
      return mesh;
    };
    add(geometry.shell, plastic, 0, 0, 0);
    // The label sits in a darker recess, on a cream plate.
    add(geometry.bezel, recess, 0, LABEL.y, front - 0.008);
    add(geometry.plate, cream, 0, LABEL.y, front + 0.006);
    add(geometry.art, art, 0, LABEL.y, front + 0.0135);
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
    add(geometry.back, recess, 0, 0.12, -front + 0.004);

    const shadow = new THREE.Mesh(geometry.shadow, shadowMaterial);
    shadow.position.set(0, -SHELL.height / 2 - 0.08, -0.4);
    const holder = new THREE.Group();
    holder.add(body, shadow);
    scene.add(holder);

    return {
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
      aim: new THREE.Vector2(),
      paint,
      stickers,
      disposables: [
        plastic,
        recess,
        art,
        texture,
      ],
    };
  }

  const items = new Map<string, Item>();
  for (const cartridge of cartridges) {
    const slot = slots.get(cartridge.id);
    if (slot) items.set(cartridge.id, build(cartridge, slot));
  }

  // The label's typeface is the site's pixel face, once it has loaded.
  const face = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-silkscreen")
    .trim();
  if (face) {
    document.fonts
      .load(`40px ${face}`)
      .then(() => {
        if (disposed) return;
        font = face;
        for (const item of items.values()) item.paint();
      })
      .catch(() => {
        // The fallback face is already drawn.
      });
  }

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
      Math.sqrt(5_000_000 / (width * height)),
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
    item.yaw.target = near ? item.aim.x * 0.5 : chosen ? 0 : REST.yaw;
    item.pitch.target = near ? item.aim.y * 0.32 : chosen ? 0 : REST.pitch;
    item.scale.target = item.pressed ? 0.96 : chosen ? 1.1 : near ? 1.06 : 1;
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
        const x = ((point.x + 1) / 2) * viewport.width;
        const y = ((1 - point.y) / 2) * viewport.height;
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
      wake();
    },
    /** Let go: it carries on round to face front, a turn further if flicked. */
    drop(id: string) {
      const item = items.get(id);
      if (!item?.dragging) return;
      item.dragging = false;
      const flick = Math.abs(item.spin.v) > 7 ? Math.sign(item.spin.v) : 0;
      item.spin.target = (Math.round(item.spin.x / TAU) + flick) * TAU;
      item.spin.v = THREE.MathUtils.clamp(item.spin.v, -14, 14);
      aimFor(item);
      wake();
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
    /** Picks one out, or puts it back. A newly picked one turns once. */
    select(id: string | null) {
      const before = selected;
      selected = id;
      for (const item of items.values()) aimFor(item);
      const item = id ? items.get(id) : undefined;
      if (item && id !== before && !options.reducedMotion) {
        item.spin.target += TAU;
      }
      wake();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      for (const timer of timers) window.clearTimeout(timer);
      resize.disconnect();
      sight.disconnect();
      for (const item of items.values()) {
        for (const thing of item.disposables) thing.dispose();
      }
      for (const shape of Object.values(geometry)) shape.dispose();
      stickerShape.dispose();
      for (const material of stickerKinds.values()) {
        material.map?.dispose();
        material.dispose();
      }
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
