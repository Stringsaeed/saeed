import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createSlugger, headingIds, slugify } from "./heading-ids";

function heading(key: string, text: string, style = "h2") {
  return {
    _type: "block",
    _key: key,
    style,
    children: [
      {
        _type: "span",
        text,
      },
    ],
  };
}

describe("heading ids", () => {
  test("slugifies like github-slugger", () => {
    assert.equal(slugify("Hello, World!"), "hello-world");
    assert.equal(slugify("The `Frame` loop"), "the-frame-loop");
    assert.equal(slugify("  Two  spaces "), "two--spaces");
    assert.equal(slugify("Café déjà vu"), "café-déjà-vu");
  });

  test("dedupes repeats in order", () => {
    const slug = createSlugger();
    assert.equal(slug("a"), "a");
    assert.equal(slug("a"), "a-1");
    assert.equal(slug("a"), "a-2");
    assert.equal(slug("a-1"), "a-1-1");
    assert.equal(slug("!!!"), "section");
  });

  test("maps h2 and h3 keys across nested callout bodies", () => {
    const ids = headingIds([
      heading("one", "Setup"),
      {
        _type: "block",
        _key: "p",
        style: "normal",
        children: [],
      },
      {
        _type: "callout",
        _key: "c",
        body: [
          heading("two", "Setup", "h3"),
        ],
      },
      heading("three", "Setup"),
    ]);

    assert.deepEqual(
      [
        ...ids,
      ],
      [
        [
          "one",
          "setup",
        ],
        [
          "two",
          "setup-1",
        ],
        [
          "three",
          "setup-2",
        ],
      ],
    );
  });
});
