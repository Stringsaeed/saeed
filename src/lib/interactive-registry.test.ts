import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { interactiveRegistry } from "@/components/interactive/registry";
import { INTERACTIVE_NAMES, isInteractiveName } from "./interactive-names";

// Lives in src/lib so `bun test src/lib` runs it with the other unit tests.
describe("interactive registry", () => {
  test("registers exactly the names posts can use", () => {
    const registered = Object.keys(interactiveRegistry).sort();
    assert.deepEqual(
      registered,
      [
        ...INTERACTIVE_NAMES,
      ].sort(),
    );
    for (const name of registered) assert.ok(isInteractiveName(name));
  });

  test("names are unique and slug-shaped", () => {
    assert.equal(new Set(INTERACTIVE_NAMES).size, INTERACTIVE_NAMES.length);
    for (const name of INTERACTIVE_NAMES)
      assert.match(name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  test("rejects unknown names", () => {
    assert.equal(isInteractiveName("pewpew-unknown"), false);
    assert.equal(isInteractiveName(undefined), false);
  });
});
