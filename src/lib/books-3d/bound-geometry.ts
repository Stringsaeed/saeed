import * as THREE from "three";

/** The jacket runs from the back cover, around two tangent arcs, to the front. Units are cm. */
export function spineProfile(
  width: number,
  depth: number,
  radius: number,
  u: number,
) {
  const r = Math.min(radius, depth / 2);
  const arc = (Math.PI * r) / 2;
  const flat = depth - 2 * r;
  const distance = u * (2 * arc + flat);
  if (distance < arc) {
    const angle = distance / r;
    return {
      x: -width / 2 + r - r * Math.sin(angle),
      z: -depth / 2 + r - r * Math.cos(angle),
      nx: -Math.sin(angle),
      nz: -Math.cos(angle),
    };
  }
  if (distance <= arc + flat)
    return {
      x: -width / 2,
      z: -depth / 2 + r + distance - arc,
      nx: -1,
      nz: 0,
    };
  const angle = (distance - arc - flat) / r;
  return {
    x: -width / 2 + r - r * Math.cos(angle),
    z: depth / 2 - r + r * Math.sin(angle),
    nx: -Math.cos(angle),
    nz: Math.sin(angle),
  };
}

export function createSpineGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number,
  board: number,
) {
  const segments = 96;
  const geometry = new THREE.PlaneGeometry(depth, height, segments, 1);
  const points = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");
  const uv = geometry.getAttribute("uv");
  if (
    !(points instanceof THREE.BufferAttribute) ||
    !(normals instanceof THREE.BufferAttribute) ||
    !(uv instanceof THREE.BufferAttribute)
  )
    throw new Error("Expected CPU spine geometry");
  for (let i = 0; i < points.count; i++) {
    const p = spineProfile(width, depth, radius, uv.getX(i));
    points.setXYZ(i, p.x, points.getY(i), p.z);
    normals.setXYZ(i, p.nx, 0, p.nz);
  }
  const caps: THREE.BufferGeometry[] = [];
  for (const side of [
    -1,
    1,
  ]) {
    const cap = new THREE.PlaneGeometry(depth, board, segments, 1);
    const positions = cap.getAttribute("position"),
      tex = cap.getAttribute("uv"),
      normal = cap.getAttribute("normal");
    if (
      !(positions instanceof THREE.BufferAttribute) ||
      !(tex instanceof THREE.BufferAttribute) ||
      !(normal instanceof THREE.BufferAttribute)
    )
      throw new Error("Expected CPU cap geometry");
    for (let i = 0; i < positions.count; i++) {
      const u = tex.getX(i),
        inner = tex.getY(i) * board;
      const p = spineProfile(width, depth, radius, u);
      positions.setXYZ(
        i,
        p.x - p.nx * inner,
        (side * height) / 2,
        p.z - p.nz * inner,
      );
      tex.setXY(i, u, side === 1 ? 1 : 0);
      normal.setXYZ(i, 0, side, 0);
    }
    if (side === -1 && cap.index) {
      for (let i = 0; i < cap.index.count; i += 3) {
        const first = cap.index.getX(i);
        cap.index.setX(i, cap.index.getX(i + 2));
        cap.index.setX(i + 2, first);
      }
    }
    caps.push(cap);
  }
  return {
    surface: geometry,
    caps,
  };
}
