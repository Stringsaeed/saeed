import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  pulledBookSize,
  roundSpineStrips,
  rubberBand,
  shelfTransform,
} from "./book-geometry";

const book = {
  width: 140,
  height: 210,
  depth: 35,
};

describe("pulledBookSize", () => {
  test("keeps the book's proportions", () => {
    const size = pulledBookSize(book, {
      width: 1280,
      height: 800,
    });

    assert.equal(size.height, 400);
    assert.ok(Math.abs(size.width / size.height - 140 / 210) < 1e-9);
    assert.ok(Math.abs(size.depth / size.height - 35 / 210) < 1e-9);
  });

  test("caps the height on tall viewports", () => {
    assert.equal(
      pulledBookSize(book, {
        width: 1600,
        height: 1400,
      }).height,
      440,
    );
  });

  test("fits the face-on cover inside a narrow viewport", () => {
    const size = pulledBookSize(book, {
      width: 280,
      height: 900,
    });

    assert.ok(size.width <= 280 - 72 + 1e-9);
  });

  test("never collapses on very short viewports", () => {
    assert.equal(
      pulledBookSize(book, {
        width: 800,
        height: 200,
      }).height,
      160,
    );
  });
});

describe("shelfTransform", () => {
  const size = pulledBookSize(book, {
    width: 1280,
    height: 800,
  });
  const rest = {
    left: 500,
    top: 150,
    width: size.width,
    height: size.height,
  };
  const slot = {
    left: 120,
    top: 600,
    width: 35,
    height: 210,
  };

  test("moves the book's centre onto the slot's centre", () => {
    const { x, y } = shelfTransform(slot, rest, size);

    assert.equal(rest.left + rest.width / 2 + x, slot.left + slot.width / 2);
    assert.equal(rest.top + rest.height / 2 + y, slot.top + slot.height / 2);
  });

  test("projects the spine onto the slot at its exact size", () => {
    const { scale } = shelfTransform(slot, rest, size);
    const magnification =
      size.perspective / (size.perspective - size.width / 2);

    assert.ok(Math.abs(size.height * scale * magnification - 210) < 1e-9);
    assert.ok(Math.abs(size.depth * scale * magnification - 35) < 1e-9);
  });
});

describe("rubberBand", () => {
  test("leaves values inside the range untouched", () => {
    assert.equal(rubberBand(12, -30, 90), 12);
  });

  test("damps travel past either limit", () => {
    const over = rubberBand(190, -30, 90);
    const under = rubberBand(-130, -30, 90);

    assert.ok(over > 90 && over < 190);
    assert.ok(under < -30 && under > -130);
  });
});

describe("roundSpineStrips", () => {
  const size = pulledBookSize(
    {
      ...book,
      spineRound: 0.3,
    },
    {
      width: 1280,
      height: 800,
    },
  );
  const strips = roundSpineStrips(size);

  test("gives the spine a bulge of the requested share of its depth", () => {
    assert.ok(Math.abs(size.spineBulge - size.depth * 0.3) < 1e-9);
  });

  test("covers the flat spine drawing edge to edge with no gaps", () => {
    // Width of the drawing each strip shows, without the seam overlap.
    const shown = strips.map((strip) => (strip.width - 1) / strip.sliceScale);
    const total = shown.reduce((sum, value) => sum + value, 0);

    assert.ok(Math.abs(total - size.depth) < 1e-6);
  });

  test("keeps the middle strip flat and undistorted", () => {
    const flat = strips[0];

    assert.equal(flat.rotateY, -90);
    assert.equal(flat.sliceScale, 1);
    assert.equal(flat.x, -size.width / 2 - size.spineBulge);
  });

  test("turns the outer strips most of the way to the covers", () => {
    const angles = strips.map((strip) => strip.rotateY);

    assert.ok(Math.max(...angles) > -15 && Math.max(...angles) < 0);
    assert.ok(Math.min(...angles) < -165 && Math.min(...angles) > -180);
  });
});
