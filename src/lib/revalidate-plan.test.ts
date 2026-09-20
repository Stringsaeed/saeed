import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { planRevalidation } from "./revalidate-plan";

describe("planRevalidation", () => {
  test("revalidates only the published post and the pages that list it", () => {
    assert.deepEqual(
      planRevalidation({
        _id: "post-example",
        _type: "post",
        slug: {
          current: "example-post",
        },
      }),
      {
        tags: [
          "posts",
          "post:example-post",
        ],
        paths: [
          "/",
          "/blog",
          "/feed.xml",
          "/sitemap.xml",
          "/blog/example-post",
          "/blog/example-post/opengraph-image",
        ],
      },
    );
  });

  test("revalidates the links page for a link document", () => {
    assert.deepEqual(
      planRevalidation({
        _type: "link",
        url: "https://example.com",
      }),
      {
        tags: [
          "links",
        ],
        paths: [
          "/links",
        ],
      },
    );
  });

  test("does nothing for drafts, unknown types, and bad slugs", () => {
    assert.equal(
      planRevalidation({
        _id: "drafts.post-example",
        _type: "post",
        slug: "example",
      }),
      null,
    );
    assert.equal(
      planRevalidation({
        _type: "page",
      }),
      null,
    );
    assert.deepEqual(
      planRevalidation({
        _type: "post",
        slug: "../admin",
      }),
      {
        tags: [
          "posts",
        ],
        paths: [
          "/",
          "/blog",
          "/feed.xml",
          "/sitemap.xml",
        ],
      },
    );
  });
});
