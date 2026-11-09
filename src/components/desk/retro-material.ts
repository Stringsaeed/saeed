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
        {
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

/** Releases the shared materials once no desk is using them. */
export function disposeFlatMaterials() {
  for (const material of materials.values()) material.dispose();
  materials.clear();
}
