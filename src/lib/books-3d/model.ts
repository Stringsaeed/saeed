import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { createSpineGeometry } from "./bound-geometry";
import type { BookModel } from "./types";

export class BookAssets {
  private textures = new Map<string, Promise<THREE.Texture>>();
  private loaded = new Set<THREE.Texture>();
  private disposed = false;
  private requests = new AbortController();
  private textFiles = new Map<string, Promise<string>>();

  text(path: string) {
    const existing = this.textFiles.get(path);
    if (existing) return existing;
    const request = fetch(path, {
      signal: this.requests.signal,
    }).then((response) => {
      if (!response.ok)
        throw new Error(`Could not load ${path}: ${response.status}`);
      return response.text();
    });
    request.catch(() => {
      this.textFiles.delete(path);
    });
    this.textFiles.set(path, request);
    return request;
  }

  texture(path: string, color = false) {
    const key = `${path}:${color}`;
    const existing = this.textures.get(key);
    if (existing) return existing;
    const request = new THREE.TextureLoader()
      .loadAsync(path)
      .then((texture) => {
        texture.anisotropy = 4;
        if (color) texture.colorSpace = THREE.SRGBColorSpace;
        if (this.disposed) texture.dispose();
        else this.loaded.add(texture);
        return texture;
      });
    request.catch(() => {
      this.textures.delete(key);
    });
    this.textures.set(key, request);
    return request;
  }

  keep(texture: THREE.Texture) {
    if (this.disposed) texture.dispose();
    else this.loaded.add(texture);
    return texture;
  }

  dispose() {
    this.disposed = true;
    this.requests.abort();
    for (const texture of this.loaded) texture.dispose();
    this.loaded.clear();
  }
}

function pageTexture(assets: BookAssets) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot create page texture");
  ctx.fillStyle = "#f0eddf";
  ctx.fillRect(0, 0, 64, 1024);
  for (let y = 0; y < 1024; y += 3) {
    const shade = 190 + ((y * 17) % 40);
    ctx.fillStyle = `rgb(${shade},${shade - 2},${shade - 9})`;
    ctx.fillRect(0, y, 64, y % 5 === 0 ? 1.2 : 0.6);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return assets.keep(texture);
}

export async function createBook(
  spec: BookModel,
  assets: BookAssets,
): Promise<THREE.Group> {
  const group = new THREE.Group();
  group.name = spec.id;
  group.userData.bookId = spec.id;
  group.userData.spec = spec;
  if (spec.kind === "stripe") {
    const [obj, vertexShader, fragmentShader] = await Promise.all([
      assets.text(spec.asset.mesh),
      assets.text(spec.asset.vertexShader),
      assets.text(spec.asset.fragmentShader),
    ]);
    const black = assets.keep(
      new THREE.DataTexture(
        new Uint8Array([
          0,
          0,
          0,
          255,
        ]),
        1,
        1,
      ),
    );
    black.needsUpdate = true;
    const uniforms: Record<string, THREE.IUniform> = THREE.UniformsUtils.clone(
      THREE.UniformsLib.lights,
    );
    const defaults: Record<
      string,
      number | number[] | THREE.Texture | THREE.Color
    > = {
      specular: new THREE.Color(0xffffff),
      shininess: 10,
      reflectiveness: 0.1,
      thickness: 1.4,
      diffuseBaseColor: [
        0.5,
        0.5,
        0.5,
      ],
      diffuseMapBase: await assets.texture(spec.asset.diffuseOverlay),
      bumpScaleBase: 0.05,
      bumpScaleCustom: 0.1,
      foilMap: black,
      foilDetail: 0.5,
      foilEmissive: 0,
      foilOpacity: 1,
      foilSpecular: 0.1,
      glossMap: black,
      glossEmissive: 0,
      glossOpacity: 1,
      glossSpecular: 0.1,
      glitterMap: black,
      glitterEmissive: 0,
      glitterOpacity: 0,
      glitterSpecular: 0,
    };
    for (const [key, value] of Object.entries(defaults))
      uniforms[key] = {
        value,
      };
    await Promise.all(
      Object.entries(spec.finish).map(async ([key, value]) => {
        if (typeof value === "string") {
          uniforms[key] = {
            value: await assets.texture(value),
          };
        } else
          uniforms[key] = {
            value,
          };
      }),
    );
    const material = new THREE.ShaderMaterial({
      vertexShader:
        "#include <common>\n#include <shadowmap_pars_vertex>\n" +
        vertexShader.replace(
          "vViewPosition = - mvPosition.xyz;",
          "vViewPosition = - mvPosition.xyz;\n#include <worldpos_vertex>\n#include <shadowmap_vertex>",
        ),
      fragmentShader: fragmentShader.replace(
        "#include <lights_pars_begin>",
        "#include <lights_pars_begin>\n#include <packing>\n#include <shadowmap_pars_fragment>",
      ),
      uniforms,
      lights: true,
      defines: {
        USE_UV: "",
        USE_MAP: "",
        USE_BUMPMAP: "",
      },
    });
    material.userData.foilOpacity = spec.finish.foilOpacity;
    material.userData.foilSpecular = spec.finish.foilSpecular;
    const imported = new OBJLoader().parse(obj);
    imported.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const old = object.material;
        for (const item of Array.isArray(old)
          ? old
          : [
              old,
            ])
          item.dispose();
        object.material = material;
      }
    });
    imported.rotation.y = -Math.PI / 2;
    group.add(imported);
  } else {
    const [front, back, spine] = await Promise.all([
      assets.texture(spec.artwork.front, true),
      assets.texture(spec.artwork.back, true),
      assets.texture(spec.artwork.spine, true),
    ]);
    const w = spec.dimensionsMm.width / 10,
      h = spec.dimensionsMm.height / 10,
      d = spec.dimensionsMm.depth / 10;
    const board = spec.construction.boardMm / 10,
      inset = spec.construction.overhangMm / 10;
    const paper = pageTexture(assets);
    const pageEdge = new THREE.MeshStandardMaterial({
      map: paper,
      roughness: 0.95,
      color: "#fffdf6",
    });
    const pageTop = pageEdge.clone();
    const topTexture = assets.keep(paper.clone());
    topTexture.center.set(0.5, 0.5);
    topTexture.rotation = Math.PI / 2;
    topTexture.needsUpdate = true;
    pageEdge.map = topTexture;
    const spineInset = Math.max(inset, spec.construction.spineRadiusMm / 10);
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(
        w - inset - spineInset,
        h - inset * 2,
        d - board * 2 - 0.04,
      ),
      [
        pageEdge,
        pageEdge,
        pageTop,
        pageTop,
        pageEdge,
        pageEdge,
      ],
    );
    block.position.x = (spineInset - inset) / 2;
    group.add(block);
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: spec.binding === "hardcover" ? "#e5e0ce" : "#eeece4",
      roughness: 0.8,
    });
    for (const [side, map] of [
      [
        1,
        front,
      ],
      [
        -1,
        back,
      ],
    ] satisfies [
      number,
      THREE.Texture,
    ][]) {
      const radius = spec.construction.spineRadiusMm / 10;
      const coverMaterial = new THREE.MeshPhysicalMaterial({
        map,
        roughness: spec.construction.roughness,
        metalness: 0,
        clearcoat: spec.construction.jacket ? 0.16 : 0.24,
        clearcoatRoughness: 0.48,
      });
      const cover = new THREE.Mesh(
        new RoundedBoxGeometry(w - radius, h, board, 5, board / 2.1),
        [
          edgeMaterial,
          edgeMaterial,
          edgeMaterial,
          edgeMaterial,
          side === 1 ? coverMaterial : edgeMaterial,
          side === -1 ? coverMaterial : edgeMaterial,
        ],
      );
      cover.position.set(radius / 2, 0, (side * (d - board)) / 2);
      group.add(cover);
    }
    const spineMaterial = new THREE.MeshPhysicalMaterial({
      map: spine,
      roughness: spec.construction.roughness,
      clearcoat: 0.15,
      clearcoatRoughness: 0.5,
    });
    const spineShape = createSpineGeometry(
      w,
      h,
      d,
      spec.construction.spineRadiusMm / 10,
      board,
    );
    group.add(new THREE.Mesh(spineShape.surface, spineMaterial));
    for (const cap of spineShape.caps)
      group.add(new THREE.Mesh(cap, spineMaterial));
  }
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  return group;
}

export type BlueprintMeshPalette = {
  core: number;
  edge: number;
  facet: number;
};

type BlueprintRig = {
  root: THREE.Group;
  photorealMeshes: THREE.Mesh[];
  coreMat: THREE.MeshBasicMaterial;
  edgeMat: THREE.LineBasicMaterial;
  facetMat: THREE.LineBasicMaterial;
};

// Matches `const float modelThickness = 3.374;` in book.vert.glsl so Stripe
// Press CAD wireframes share the exact vertex displacement of the GLSL shader.
const STRIPE_BASE_THICKNESS_CM = 3.374;

function cloneGeometryForBlueprint(
  geometry: THREE.BufferGeometry,
  spec: BookModel | undefined,
) {
  const clone = geometry.clone();
  if (spec?.kind === "stripe") {
    const thickness =
      typeof spec.finish.thickness === "number" ? spec.finish.thickness : 1.4;
    const delta = (thickness - STRIPE_BASE_THICKNESS_CM) / 2;
    const pos = clone.getAttribute("position");
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        if (x > 1) pos.setX(i, x + delta);
        else if (x < -1) pos.setX(i, x - delta);
      }
      pos.needsUpdate = true;
      clone.computeBoundingBox();
      clone.computeBoundingSphere();
    }
  }
  return clone;
}

function getOrCreateBlueprintRig(
  group: THREE.Group,
  palette: BlueprintMeshPalette,
): BlueprintRig {
  const existing = group.userData.blueprintRig as BlueprintRig | undefined;
  if (existing) return existing;

  const photorealMeshes: THREE.Mesh[] = [];
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) photorealMeshes.push(object);
  });

  const coreMat = new THREE.MeshBasicMaterial({
    color: palette.core,
    transparent: true,
    opacity: 0.91,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const edgeMat = new THREE.LineBasicMaterial({
    color: palette.edge,
    transparent: true,
    opacity: 0.96,
  });
  const facetMat = new THREE.LineBasicMaterial({
    color: palette.facet,
    transparent: true,
    opacity: 0.22,
  });

  const root = new THREE.Group();
  root.name = `${group.name}-blueprint`;
  const spec = group.userData.spec as BookModel | undefined;

  group.updateMatrixWorld(true);
  const groupInverse = group.matrixWorld.clone().invert();

  for (const mesh of photorealMeshes) {
    const localMatrix = groupInverse.clone().multiply(mesh.matrixWorld);
    const geom = cloneGeometryForBlueprint(mesh.geometry, spec);

    const coreMesh = new THREE.Mesh(geom, coreMat);
    coreMesh.applyMatrix4(localMatrix);
    root.add(coreMesh);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geom, 16),
      edgeMat,
    );
    edges.applyMatrix4(localMatrix);
    root.add(edges);

    const facets = new THREE.LineSegments(
      new THREE.WireframeGeometry(geom),
      facetMat,
    );
    facets.applyMatrix4(localMatrix);
    root.add(facets);
  }

  group.add(root);
  const rig: BlueprintRig = {
    root,
    photorealMeshes,
    coreMat,
    edgeMat,
    facetMat,
  };
  group.userData.blueprintRig = rig;
  return rig;
}

export function applyBookBlueprint(
  group: THREE.Group,
  palette: BlueprintMeshPalette | null,
) {
  if (!palette) {
    const rig = group.userData.blueprintRig as BlueprintRig | undefined;
    if (!rig) return;
    rig.root.visible = false;
    for (const mesh of rig.photorealMeshes) mesh.visible = true;
    return;
  }

  const rig = getOrCreateBlueprintRig(group, palette);
  rig.coreMat.color.setHex(palette.core);
  rig.edgeMat.color.setHex(palette.edge);
  rig.facetMat.color.setHex(palette.facet);
  for (const mesh of rig.photorealMeshes) mesh.visible = false;
  rig.root.visible = true;
}

export function disposeModel(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material)
        ? object.material
        : [
            object.material,
          ])
        materials.add(material);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}
