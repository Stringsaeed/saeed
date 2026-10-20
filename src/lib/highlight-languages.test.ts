import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  CODE_LANGUAGE_OPTIONS,
  HIGHLIGHT_LANGUAGES,
  resolveLanguage,
} from "./highlight-languages";

describe("resolveLanguage", () => {
  test("accepts loaded languages and common aliases", () => {
    assert.equal(resolveLanguage("tsx"), "tsx");
    assert.equal(resolveLanguage(" TypeScript "), "ts");
    assert.equal(resolveLanguage("sh"), "bash");
    assert.equal(resolveLanguage("kt"), "kotlin");
  });

  test("falls back to plain text", () => {
    assert.equal(resolveLanguage("plaintext"), null);
    assert.equal(resolveLanguage("text"), null);
    assert.equal(resolveLanguage("cobol"), null);
    assert.equal(resolveLanguage(undefined), null);
  });

  test("every Studio option is highlighted or plain text", () => {
    for (const option of CODE_LANGUAGE_OPTIONS) {
      const resolved = resolveLanguage(option.value);
      if (option.value === "plaintext") assert.equal(resolved, null);
      else assert.ok(HIGHLIGHT_LANGUAGES.includes(resolved ?? ("" as never)));
    }
  });
});
