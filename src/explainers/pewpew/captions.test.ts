import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { INTERACTIVE_NAMES } from "../../lib/interactive-names";
import type { ContentBlock } from "../../lib/markdown-to-portable-text";
import { PEWPEW_CAPTIONS, withPewpewCaptions } from "./captions";

describe("pewpew captions", () => {
  test("every pewpew- figure has a non-empty caption", () => {
    const names = INTERACTIVE_NAMES.filter((name) =>
      name.startsWith("pewpew-"),
    );
    assert.equal(names.length, 17);
    for (const name of names) {
      const caption: unknown = Reflect.get(PEWPEW_CAPTIONS, name);
      assert.equal(typeof caption, "string", name);
      assert.notEqual(String(caption).trim(), "", name);
    }
    assert.deepEqual(
      Object.keys(PEWPEW_CAPTIONS).sort(),
      [
        ...names,
      ].sort(),
    );
  });

  test("captions are plain text, with the steer values filled in", () => {
    for (const [name, caption] of Object.entries(PEWPEW_CAPTIONS)) {
      assert.equal(caption.includes("`"), false, name);
      assert.equal(caption.includes("${"), false, name);
    }
    assert.match(
      PEWPEW_CAPTIONS["pewpew-steer"],
      /COAST_DAMPING \(0\.9\).*11\.25 units: dragInput\(0, 1\) = 4\./,
    );
  });

  test("withPewpewCaptions fills only pewpew blocks without a caption", () => {
    const blocks: ContentBlock[] = [
      {
        _type: "interactive",
        _key: "a",
        name: "pewpew-pool",
      },
      {
        _type: "interactive",
        _key: "b",
        name: "pewpew-bot",
        caption: "Kept.",
      },
      {
        _type: "interactive",
        _key: "c",
        name: "demo-placeholder",
      },
      {
        _type: "block",
        _key: "d",
        style: "normal",
      },
    ];
    const [pool, bot, demo, text] = withPewpewCaptions(blocks);
    assert.equal(pool?.caption, PEWPEW_CAPTIONS["pewpew-pool"]);
    assert.equal(bot?.caption, "Kept.");
    assert.equal(demo?.caption, undefined);
    assert.equal(text, blocks[3]);
  });
});
