import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	appendVaryAccept,
	preferredRepresentation,
} from "./content-negotiation";

describe("preferredRepresentation", () => {
	test("serves HTML when no preference is provided", () => {
		assert.equal(preferredRepresentation(null), "text/html");
		assert.equal(preferredRepresentation("*/*"), "text/html");
	});

	test("serves Markdown when the client prefers it", () => {
		assert.equal(
			preferredRepresentation("text/markdown, text/html;q=0.8"),
			"text/markdown",
		);
	});

	test("honors quality values and client order", () => {
		assert.equal(
			preferredRepresentation("text/markdown;q=0.5, text/html;q=0.9"),
			"text/html",
		);
		assert.equal(
			preferredRepresentation("text/markdown, text/html, */*"),
			"text/markdown",
		);
	});

	test("lets a specific rejection override a wildcard", () => {
		assert.equal(
			preferredRepresentation("text/markdown;q=0, */*;q=1"),
			"text/html",
		);
	});

	test("returns null when no representation is acceptable", () => {
		assert.equal(preferredRepresentation("application/pdf"), null);
		assert.equal(
			preferredRepresentation("text/html;q=0, text/markdown;q=0"),
			null,
		);
	});
});

describe("appendVaryAccept", () => {
	test("adds Accept without dropping existing cache keys", () => {
		const headers = new Headers({
			Vary: "RSC, Accept-Encoding",
		});

		appendVaryAccept(headers);

		assert.equal(headers.get("Vary"), "RSC, Accept-Encoding, Accept");
	});

	test("does not duplicate an existing Accept value", () => {
		const headers = new Headers({
			Vary: "RSC, accept",
		});

		appendVaryAccept(headers);

		assert.equal(headers.get("Vary"), "RSC, accept");
	});
});
