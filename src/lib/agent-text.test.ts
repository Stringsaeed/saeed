import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  portableTextToMarkdown,
  postSlugFromPath,
  search,
  tokenize,
} from "./agent-text";

describe("tokenize", () => {
  test("lowercases and drops single characters", () => {
    assert.deepEqual(tokenize("A React-Native, perf!"), [
      "react",
      "native",
      "perf",
    ]);
  });
});

describe("search", () => {
  const items = [
    {
      title: "Gardener",
      description: "Keep the garden tidy",
      tags: [
        "ai",
      ],
    },
    {
      title: "Native code",
      description: "Bridges to iOS",
      tags: [
        "react",
      ],
    },
  ];
  const fields = (item: (typeof items)[number]) => [
    {
      text: item.title,
      weight: 3,
    },
    {
      text: item.description,
      weight: 2,
    },
    {
      text: item.tags.join(" "),
      weight: 1,
    },
  ];

  test("finds items by title and by description", () => {
    assert.deepEqual(
      search(items, "native", fields, 10).map((hit) => hit.title),
      [
        "Native code",
      ],
    );
    assert.deepEqual(
      search(items, "tidy", fields, 10).map((hit) => hit.title),
      [
        "Gardener",
      ],
    );
  });

  test("ranks a title match above a description match", () => {
    const hits = search(items, "code garden", fields, 10).map(
      (hit) => hit.title,
    );
    assert.deepEqual(hits, [
      "Gardener",
      "Native code",
    ]);
  });

  test("returns nothing for an empty or unmatched query", () => {
    assert.deepEqual(search(items, "   ", fields, 10), []);
    assert.deepEqual(search(items, "kubernetes", fields, 10), []);
  });

  test("respects the limit", () => {
    assert.equal(search(items, "code garden", fields, 1).length, 1);
  });
});

describe("portableTextToMarkdown", () => {
  test("renders headings, lists, marks, links, and code", () => {
    const markdown = portableTextToMarkdown([
      {
        _type: "block",
        _key: "1",
        style: "h2",
        children: [
          {
            _type: "span",
            _key: "a",
            text: "Intro",
            marks: [],
          },
        ],
      },
      {
        _type: "block",
        _key: "2",
        style: "normal",
        markDefs: [
          {
            _key: "l",
            _type: "link",
            href: "https://example.com",
          },
        ],
        children: [
          {
            _type: "span",
            _key: "b",
            text: "Read ",
            marks: [],
          },
          {
            _type: "span",
            _key: "c",
            text: "this",
            marks: [
              "strong",
              "l",
            ],
          },
        ],
      },
      {
        _type: "block",
        _key: "3",
        style: "normal",
        listItem: "bullet",
        level: 1,
        children: [
          {
            _type: "span",
            _key: "d",
            text: "one",
            marks: [],
          },
        ],
      },
      {
        _type: "code",
        _key: "4",
        language: "ts",
        code: "const x = 1;\n",
      },
    ]);

    assert.equal(
      markdown,
      [
        "## Intro",
        "",
        "Read [**this**](https://example.com)",
        "",
        "- one",
        "",
        "```ts",
        "const x = 1;",
        "```",
      ].join("\n"),
    );
  });
});

describe("postSlugFromPath", () => {
  test("reads the slug from a post path", () => {
    assert.equal(
      postSlugFromPath("/blog/every-team-needs-a-gardener"),
      "every-team-needs-a-gardener",
    );
    assert.equal(postSlugFromPath("/blog/my-post/"), "my-post");
  });

  test("returns null for other pages and unsafe slugs", () => {
    assert.equal(postSlugFromPath("/blog"), null);
    assert.equal(postSlugFromPath("/"), null);
    assert.equal(postSlugFromPath("/blog/../etc"), null);
    assert.equal(postSlugFromPath("/blog/Upper-Case"), null);
  });
});
