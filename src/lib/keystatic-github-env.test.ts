import assert from "node:assert/strict";
import test from "node:test";
import { missingKeystaticGithubEnv } from "./keystatic-github-env";

test("names every missing Keystatic GitHub env var", () => {
  assert.deepEqual(missingKeystaticGithubEnv({}), [
    "KEYSTATIC_GITHUB_CLIENT_ID",
    "KEYSTATIC_GITHUB_CLIENT_SECRET",
    "KEYSTATIC_SECRET",
  ]);
});

test("treats blank values as missing", () => {
  assert.deepEqual(
    missingKeystaticGithubEnv({
      KEYSTATIC_GITHUB_CLIENT_ID: " iv1 ",
      KEYSTATIC_GITHUB_CLIENT_SECRET: "   ",
      KEYSTATIC_SECRET: "x".repeat(32),
    }),
    [
      "KEYSTATIC_GITHUB_CLIENT_SECRET",
    ],
  );
});
