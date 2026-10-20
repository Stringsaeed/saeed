import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { markdownToPortableText } from "./markdown-to-portable-text";

describe("markdownToPortableText", () => {
  test("turns prose, headings, lists, and code into portable text", () => {
    const blocks = markdownToPortableText(`## Heading

A [site path](/blog/example) and a **bold** word.

- item one
- item two

\`\`\`tsx
const value = 1
\`\`\`
`);

    assert.equal(blocks[0]?.style, "h2");
    assert.equal(blocks[0]?._type, "block");
    const link = blocks[1]?.markDefs?.find((mark) => mark._type === "link");
    assert.equal(link?.href, "/blog/example");
    assert.equal(blocks[2]?.listItem, "bullet");
    assert.equal(blocks[3]?.listItem, "bullet");
    assert.equal(blocks[4]?._type, "code");
    assert.equal(blocks[4]?.language, "tsx");
    assert.equal(
      blocks.some((block) => block._type === "script"),
      false,
    );
  });

  test("drops javascript, data, and vbscript links", () => {
    const blocks = markdownToPortableText(
      "[bad](javascript:alert(1)) [data](data:text/html,hi) [script](vbscript:msgbox(1)) [ok](https://example.com)",
    );
    const hrefs = blocks.flatMap(
      (block) => block.markDefs?.map((mark) => mark.href) ?? [],
    );
    assert.deepEqual(hrefs, [
      "https://example.com",
    ]);
    assert.match(
      blocks[0]?.children?.map((child) => child.text).join("") ?? "",
      /bad/,
    );
  });

  test("turns a {{name}} paragraph into an interactive block", () => {
    const blocks = markdownToPortableText(`Before.

{{demo-placeholder}}

{{ pewpew-step }}

{{not-a-figure}}

Inline {{demo-placeholder}} stays text.
`);

    assert.deepEqual(
      blocks.map((block) => block._type),
      [
        "block",
        "interactive",
        "interactive",
        "block",
        "block",
      ],
    );
    assert.equal(blocks[1]?.name, "demo-placeholder");
    assert.equal(blocks[2]?.name, "pewpew-step");
    assert.equal(blocks[3]?.children?.[0]?.text, "{{not-a-figure}}");
    assert.match(
      blocks[4]?.children?.map((child) => child.text).join("") ?? "",
      /\{\{demo-placeholder\}\}/,
    );
  });
});
