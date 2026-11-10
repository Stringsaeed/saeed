import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as THREE from "three";
import {
  blueprintDrawingSpec,
  shouldHandleBlueprintShortcut,
} from "./blueprint";
import { applyBookBlueprint, disposeModel } from "./books-3d/model";

describe("shouldHandleBlueprintShortcut", () => {
  test("accepts plain b and B keydowns outside form controls", () => {
    assert.equal(
      shouldHandleBlueprintShortcut({
        key: "b",
        target: {
          tagName: "BODY",
        },
      }),
      true,
    );
    assert.equal(
      shouldHandleBlueprintShortcut({
        key: "B",
        target: {
          tagName: "BUTTON",
        },
      }),
      true,
    );
  });

  test("ignores modified, repeated, prevented, or unrelated keys", () => {
    assert.equal(
      shouldHandleBlueprintShortcut({
        key: "b",
        metaKey: true,
      }),
      false,
    );
    assert.equal(
      shouldHandleBlueprintShortcut({
        key: "b",
        ctrlKey: true,
      }),
      false,
    );
    assert.equal(
      shouldHandleBlueprintShortcut({
        key: "b",
        altKey: true,
      }),
      false,
    );
    assert.equal(
      shouldHandleBlueprintShortcut({
        key: "b",
        repeat: true,
      }),
      false,
    );
    assert.equal(
      shouldHandleBlueprintShortcut({
        key: "b",
        defaultPrevented: true,
      }),
      false,
    );
    assert.equal(
      shouldHandleBlueprintShortcut({
        key: "k",
      }),
      false,
    );
  });

  test("ignores editable fields so typing never flips the theme", () => {
    assert.equal(
      shouldHandleBlueprintShortcut({
        key: "b",
        target: {
          tagName: "INPUT",
        },
      }),
      false,
    );
    assert.equal(
      shouldHandleBlueprintShortcut({
        key: "b",
        target: {
          tagName: "TEXTAREA",
        },
      }),
      false,
    );
    assert.equal(
      shouldHandleBlueprintShortcut({
        key: "b",
        target: {
          tagName: "DIV",
          isContentEditable: true,
        },
      }),
      false,
    );
  });
});

describe("blueprintDrawingSpec", () => {
  test("maps each site route to a distinct CAD drawing code", () => {
    assert.equal(blueprintDrawingSpec("/").code, "SG-01");
    assert.equal(blueprintDrawingSpec("/blog").code, "SG-02");
    assert.equal(
      blueprintDrawingSpec("/blog/dark-mode-react-native").code,
      "SG-02A",
    );
    assert.equal(blueprintDrawingSpec("/links").code, "SG-03");
  });
});

describe("applyBookBlueprint", () => {
  test("swaps photorealistic meshes for CAD wireframe rigs and restores them cleanly", () => {
    const group = new THREE.Group();
    const cover = new THREE.Mesh(
      new THREE.BoxGeometry(10, 15, 2),
      new THREE.MeshBasicMaterial(),
    );
    group.add(cover);

    applyBookBlueprint(group, {
      core: 0x0b223e,
      edge: 0xe2f1ff,
      facet: 0x56a8f5,
    });

    assert.equal(cover.visible, false);
    let lineSegmentsCount = 0;
    group.traverse((obj) => {
      if (obj instanceof THREE.LineSegments && obj.visible) {
        lineSegmentsCount += 1;
      }
    });
    assert.ok(lineSegmentsCount >= 2);

    applyBookBlueprint(group, null);
    assert.equal(cover.visible, true);

    disposeModel(group);
  });
});
