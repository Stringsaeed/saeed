import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { getSiteOrigin } from "./site";

const originalPublicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const originalVercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

afterEach(() => {
	if (originalPublicSiteUrl === undefined) {
		delete process.env.NEXT_PUBLIC_SITE_URL;
	} else {
		process.env.NEXT_PUBLIC_SITE_URL = originalPublicSiteUrl;
	}

	if (originalVercelProductionUrl === undefined) {
		delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
	} else {
		process.env.VERCEL_PROJECT_PRODUCTION_URL = originalVercelProductionUrl;
	}
});

describe("getSiteOrigin", () => {
	test("uses the canonical domain instead of Vercel's generated alias", () => {
		delete process.env.NEXT_PUBLIC_SITE_URL;
		process.env.VERCEL_PROJECT_PRODUCTION_URL = "saeed-theta.vercel.app";

		assert.equal(getSiteOrigin(), "https://thisissaeed.com");
	});

	test("allows an explicit public site URL override", () => {
		process.env.NEXT_PUBLIC_SITE_URL = "preview.example.com";
		process.env.VERCEL_PROJECT_PRODUCTION_URL = "saeed-theta.vercel.app";

		assert.equal(getSiteOrigin(), "https://preview.example.com");
	});
});
