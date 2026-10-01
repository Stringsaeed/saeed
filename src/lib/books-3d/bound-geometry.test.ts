import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { BufferAttribute, Vector3 } from "three";
import { createSpineGeometry, spineProfile } from "./bound-geometry";

function near(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 0.00001, `${actual} != ${expected}`);
}

describe("rounded jacket geometry", () => {
  test("joins the back and front cover at their physical edges and tangent normals", () => {
    const back = spineProfile(16, 2.5, 0.35, 0);
    const front = spineProfile(16, 2.5, 0.35, 1);
    near(back.x, -7.65);
    near(back.z, -1.25);
    near(back.nx, 0);
    near(back.nz, -1);
    near(front.x, -7.65);
    near(front.z, 1.25);
    near(front.nx, 0);
    near(front.nz, 1);
    const middle = spineProfile(16, 2.5, 0.35, 0.5);
    near(middle.x, -8);
    near(middle.z, 0);
    near(middle.nx, -1);
    near(middle.nz, 0);
  });

  test("preserves the measured height and thickness", () => {
    const shape = createSpineGeometry(16, 23.5, 2.5, 0.35, 0.18);
    shape.surface.computeBoundingBox();
    assert.ok(shape.surface.boundingBox);
    near(shape.surface.boundingBox.min.y, -11.75);
    near(shape.surface.boundingBox.max.y, 11.75);
    near(shape.surface.boundingBox.min.z, -1.25);
    near(shape.surface.boundingBox.max.z, 1.25);
    for (const geometry of [
      shape.surface,
      ...shape.caps,
    ])
      geometry.dispose();
  });

  test("end caps face outward so neither disappears when viewed from above or below", () => {
    const shape = createSpineGeometry(16, 23.5, 2.5, 0.35, 0.18);
    for (const cap of shape.caps) {
      const positions = cap.getAttribute("position");
      const normals = cap.getAttribute("normal");
      assert.ok(positions instanceof BufferAttribute);
      assert.ok(normals instanceof BufferAttribute);
      const index = cap.index;
      assert.ok(index);
      for (let i = 0; i < index.count; i += 3) {
        const a = new Vector3().fromBufferAttribute(positions, index.getX(i));
        const b = new Vector3().fromBufferAttribute(
          positions,
          index.getX(i + 1),
        );
        const c = new Vector3().fromBufferAttribute(
          positions,
          index.getX(i + 2),
        );
        const expected = new Vector3().fromBufferAttribute(
          normals,
          index.getX(i),
        );
        assert.ok(b.sub(a).cross(c.sub(a)).normalize().dot(expected) > 0.99);
      }
    }
    for (const geometry of [
      shape.surface,
      ...shape.caps,
    ])
      geometry.dispose();
  });
});
