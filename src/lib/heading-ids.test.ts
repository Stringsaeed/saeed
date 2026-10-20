import assert from "node:assert/strict";
import { describe, test } from "node:test";
import GithubSlugger from "github-slugger";
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

const realHeadings = [
  "The Challenge: Consistency in Theme Selection",
  "Step 1: Creating a React Context for the Theme",
  "Step 2: Enabling User Theme Persistence Using Storage",
  "Exploring Theme Variations",
  "Without Appearance API",
  "The `Frame` loop",
  "Why 60 Hz? (and not 120)",
  "Café déjà vu",
  "Hello, World!",
  "snake_case & kebab-case",
  "Ship it 🚀",
  "What’s a “fixed step”?",
  "Two  spaces",
  "a",
  "a",
  "a-1",
  "Exploring Theme Variations",
];

describe("heading ids", () => {
  test("match github-slugger for real headings, in order", () => {
    const ours = createSlugger();
    const github = new GithubSlugger();
    for (const text of realHeadings) {
      assert.equal(ours(text), github.slug(text), text);
    }
  });

  test("dedupes repeats like github-slugger", () => {
    const slug = createSlugger();
    assert.deepEqual(
      [
        slug("a"),
        slug("a"),
        slug("a"),
        slug("a-1"),
      ],
      [
        "a",
        "a-1",
        "a-2",
        "a-1-1",
      ],
    );
  });

  test("deliberate differences: trims, and empty becomes section", () => {
    assert.equal(slugify("  Padded  "), "padded");
    assert.equal(new GithubSlugger().slug("  Padded  "), "--padded--");
    const slug = createSlugger();
    assert.equal(slug("!!!"), "section");
    assert.equal(slug("🚀"), "section-1");
  });

  test("ids cover nested callouts and survive repeated _keys", () => {
    const first = heading("same", "Setup");
    const nested = heading("same", "Setup", "h3");
    const last = heading("other", "Setup");
    const ids = headingIds([
      first,
      {
        _type: "block",
        style: "normal",
        children: [],
      },
      {
        _type: "callout",
        body: [
          nested,
        ],
      },
      last,
    ]);

    assert.equal(ids.get(first), "setup");
    assert.equal(ids.get(nested), "setup-1");
    assert.equal(ids.get(last), "setup-2");
  });
});
