import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  coversProtectedContent,
  type FieldGeometry,
  isPlacementValid,
  moveSticker,
  type StickerPlacement,
  snapStickerToNearestSafe,
} from "./sticker-placement";

const geometry: FieldGeometry = {
  height: 900,
  width: 1400,
  protectedRectangles: [
    {
      left: 460,
      top: 24,
      right: 940,
      bottom: 860,
    },
  ],
};

function sticker(offsetX: number, offsetY = 0): StickerPlacement {
  return {
    id: "keyboard",
    label: "Keyboard",
    sound: "toggle",
    src: "/stickers/lofree-block.png",
    story: "A sticker.",
    width: 120,
    height: 80,
    left: 80,
    top: 360,
    offsetX,
    offsetY,
    scale: 1,
    rotation: 0,
  };
}

describe("sticker drag through protected content", () => {
  test("follows the pointer through the protected area and out the other side", () => {
    const placements = [
      sticker(0),
    ];
    const inside = moveSticker(placements, "keyboard", 420, 0, geometry, true);
    const crossed = moveSticker(inside, "keyboard", 980, 0, geometry, true);
    const crossedSticker = crossed[0];

    assert.equal(inside[0]?.offsetX, 420);
    assert.equal(
      coversProtectedContent(inside[0] ?? sticker(0), geometry),
      true,
    );
    assert.equal(crossedSticker?.offsetX, 980);
    assert.equal(
      coversProtectedContent(crossedSticker ?? sticker(0), geometry),
      false,
    );
    assert.equal(
      isPlacementValid(crossedSticker ?? sticker(0), crossed, geometry),
      true,
    );
  });

  test("still refuses a resting position inside the protected area", () => {
    const placements = [
      sticker(0),
    ];
    const blocked = moveSticker(placements, "keyboard", 420, 0, geometry);

    assert.equal(blocked[0]?.offsetX, 0);
    assert.equal(blocked[0]?.offsetY, 0);
  });

  test("snaps a release inside the protected area to the nearest safe side", () => {
    const inside = [
      sticker(420),
    ];
    const snapped = snapStickerToNearestSafe(inside, "keyboard", geometry);
    const next = snapped[0];

    assert.ok(next);
    assert.equal(coversProtectedContent(next, geometry), false);
    assert.equal(isPlacementValid(next, snapped, geometry), true);
    assert.ok(next.offsetX < 420);
    assert.equal(next.offsetY, 0);
  });

  test("leaves an already safe release where it is", () => {
    const outside = [
      sticker(980, 40),
    ];
    const snapped = snapStickerToNearestSafe(outside, "keyboard", geometry);

    assert.equal(snapped, outside);
    assert.equal(snapped[0]?.offsetX, 980);
    assert.equal(snapped[0]?.offsetY, 40);
  });
});
