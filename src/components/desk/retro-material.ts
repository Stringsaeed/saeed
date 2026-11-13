import * as THREE from "three";

// What every material on the desk shares: the size of the low-resolution
// buffer it is drawn into, so vertices can snap to its grid the way a
// PlayStation did, and the flat-shaded Lambert that all the objects wear.

/** Called by anything that changed a texture or material after the fact,
 *  so every desk on the page draws again. */
export const redraw = new Set<() => void>();

/** The render buffer size in texels; the stage keeps it current. */
export const lowRes = {
  value: new THREE.Vector2(320, 180),
};

/** Snaps clip-space positions to the texel grid: the PS1 wobble. */
export function snapVertices(material: THREE.Material) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.lowRes = lowRes;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform vec2 lowRes;")
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        // Only in front of the eye: behind it there is no screen to snap to.
        if (gl_Position.w > 0.05) {
          vec4 snapped = gl_Position;
          snapped.xyz /= snapped.w;
          vec2 grid = lowRes * 0.5;
          snapped.xy = floor(snapped.xy * grid + 0.5) / grid;
          snapped.xyz *= snapped.w;
          gl_Position = snapped;
        }`,
      );
  };
  material.customProgramCacheKey = () => "snap";
  return material;
}

const materials = new Map<number, THREE.MeshLambertMaterial>();

/** One flat-shaded material per colour, shared by every object. */
export function flat(color: number) {
  let material = materials.get(color);
  if (!material) {
    material = new THREE.MeshLambertMaterial({
      color,
      flatShading: true,
    });
    snapVertices(material);
    materials.set(color, material);
  }
  return material;
}

/** A colour no object wears. Lines drawn in it are inked by the retro pass,
 *  in the page's ink and without dithering. */
export const INK_KEY = 0xff00ff;

type Paper = {
  /** Furniture: the face toward the light. */
  page: THREE.MeshBasicMaterial;
  /** Furniture: the faces turned away. */
  tone: THREE.MeshBasicMaterial;
  /** Fabric: a seat, a chair back. */
  soft: THREE.MeshBasicMaterial;
  rug: THREE.MeshBasicMaterial;
  /** The room itself. */
  wall: THREE.MeshBasicMaterial;
  shade: THREE.MeshBasicMaterial;
  floor: THREE.MeshBasicMaterial;
  ceiling: THREE.MeshBasicMaterial;
  /** Drawn edges. Rendered last so no shadow tints them. */
  line: THREE.LineBasicMaterial;
};

let paperKit: Paper | null = null;

function paperFace() {
  // Faces sit a hair behind their own edges so the drawn lines win.
  return snapVertices(
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    }),
  ) as THREE.MeshBasicMaterial;
}

/** What the room and its furniture are made of: a few flat colours and a
 *  pen. The same objects for the life of the page, so a theme change
 *  reaches every mesh that wears them. */
export function paper() {
  if (!paperKit) {
    paperKit = {
      page: paperFace(),
      tone: paperFace(),
      soft: paperFace(),
      rug: paperFace(),
      wall: paperFace(),
      shade: paperFace(),
      floor: paperFace(),
      ceiling: paperFace(),
      line: snapVertices(
        new THREE.LineBasicMaterial({
          color: INK_KEY,
          transparent: true,
        }),
      ) as THREE.LineBasicMaterial,
    };
    setPaperTheme(false);
  }
  return paperKit;
}

// Day and night. The retro pass keeps five levels a channel. A colour on
// those levels comes out flat; one that sits halfway between two of them
// in every channel comes out as a clean stipple of two colours; anything
// else speckles in three. The pass undoes gamma with a plain power, so the
// hex that lands on a level is 00, 3d, 80, bf or ff, and halfway is 1a, 5f,
// a1 or e0.
const PALETTE = {
  day: {
    page: 0xffffff,
    tone: 0xe0e0e0,
    soft: 0xbf3d3d,
    rug: 0x3d80bf,
    wall: 0xffffe0,
    shade: 0xffe0bf,
    floor: 0xbf803d,
    ceiling: 0xffffff,
  },
  night: {
    page: 0x8080bf,
    tone: 0x5f5fa1,
    soft: 0x803d80,
    rug: 0x5f1a80,
    wall: 0x3d3d80,
    shade: 0x1a1a5f,
    floor: 0x1a1a3d,
    ceiling: 0x1a1a5f,
  },
} as const;

/** Light drawn as a stipple: a lamp's cone, a projector's beam. By day it
 *  is laid over what is behind it; at night it is added, the way light is. */
const glows = new Set<THREE.Material>();
let night = false;

export function glow(material: THREE.Material) {
  glows.add(material);
  material.blending = night ? THREE.AdditiveBlending : THREE.NormalBlending;
  return material;
}

export function setPaperTheme(dark: boolean) {
  const kit = paper();
  const colors = dark ? PALETTE.night : PALETTE.day;
  for (const [name, color] of Object.entries(colors)) {
    kit[name as keyof typeof colors].color.set(color);
  }
  night = dark;
  for (const material of glows) {
    material.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    material.needsUpdate = true;
  }
}

/** Releases the shared materials once no desk is using them. */
export function disposeFlatMaterials() {
  for (const material of materials.values()) material.dispose();
  materials.clear();
  glows.clear();
  if (paperKit) {
    for (const material of Object.values(paperKit)) material.dispose();
  }
}
