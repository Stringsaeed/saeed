import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { assertHttpsUrl, isHttpsUrl } from "./https-url";

describe("isHttpsUrl", () => {
  test("accepts https URLs", () => {
    assert.equal(isHttpsUrl("https://example.com/path?q=1#hash"), true);
  });

  test("rejects javascript, data, vbscript, and http", () => {
    assert.equal(isHttpsUrl("javascript:alert(1)"), false);
    assert.equal(isHttpsUrl("JavaScript:alert(1)"), false);
    assert.equal(isHttpsUrl("data:text/html,hi"), false);
    assert.equal(isHttpsUrl("vbscript:msgbox(1)"), false);
    assert.equal(isHttpsUrl("http://example.com"), false);
    assert.equal(isHttpsUrl(" https://example.com"), false);
  });

  test("assertHttpsUrl throws for a rejected URL", () => {
    assert.throws(() => assertHttpsUrl("javascript:alert(1)"));
  });
});
