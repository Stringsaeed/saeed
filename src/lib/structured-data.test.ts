import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getRootStructuredData } from "./structured-data";

describe("root structured data", () => {
	test("identifies the person with a unique full name and matching profiles", () => {
		const data = getRootStructuredData();
		const graph = data["@graph"];
		const person = graph.find((entry) => entry["@type"] === "Person");

		assert.ok(person);
		assert.equal(person.name, "Muhammed Saeed");
		assert.deepEqual(person.alternateName, [
			"Saeed",
			"Stringsaeed",
			"This is Saeed",
		]);
		assert.ok(Array.isArray(person.sameAs));
		assert.ok(person.sameAs.includes("https://github.com/stringsaeed"));
	});

	test("marks the homepage as a profile page", () => {
		const data = getRootStructuredData();
		const profile = data["@graph"].find(
			(entry) => entry["@type"] === "ProfilePage",
		);

		assert.ok(profile);
		assert.equal(profile.url, "https://thisissaeed.com/");
	});
});
