import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { GET as getMarkdownResponse } from "@/app/api/markdown/[[...path]]/route";
import { posts } from "@/content/blog/posts";
import { homeIntroduction, trustPages } from "@/content/site-content";
import {
	getLlmsText,
	getMarkdownForPath,
	getMarkdownSibling,
	getNotFoundMarkdown,
	publicPagePaths,
} from "./agent-content";

function contentLength(value: string) {
	return value
		.replace(/[#>*_`()\-:]/g, " ")
		.replaceAll("[", " ")
		.replaceAll("]", " ")
		.replace(/\s+/g, " ")
		.trim().length;
}

describe("human-readable content", () => {
	test("the homepage introduction exceeds 500 meaningful characters", () => {
		assert.ok(homeIntroduction.join(" ").length >= 500);
	});

	for (const [slug, page] of Object.entries(trustPages)) {
		test(`${slug} contains at least 500 characters`, () => {
			const content = [
				...page.intro,
				...page.sections.flatMap((section) => section.paragraphs),
			].join(" ");

			assert.ok(content.length >= 500, `${slug} has ${content.length} chars`);
		});
	}
});

describe("Markdown representations", () => {
	test("every canonical HTML page has a Markdown representation", async () => {
		for (const pathname of publicPagePaths) {
			const markdown = await getMarkdownForPath(pathname);
			assert.ok(markdown, `Missing Markdown for ${pathname}`);
			assert.match(markdown, /^# /);
		}
	});

	test("the homepage Markdown carries substantial content", async () => {
		const markdown = await getMarkdownForPath("/");
		assert.ok(markdown);
		assert.ok(contentLength(markdown) >= 1_000);
	});

	test("unknown paths return no page content and a recovery document", async () => {
		assert.equal(await getMarkdownForPath("/missing-page"), null);

		const recovery = getNotFoundMarkdown("/missing-page");
		assert.match(recovery, /^# 404: Page not found/);
		assert.match(recovery, /https:\/\/thisissaeed\.com\/llms\.txt/);
		assert.match(recovery, /https:\/\/thisissaeed\.com\/sitemap\.xml/);
	});

	test("uses stable Markdown sibling URLs", () => {
		assert.equal(getMarkdownSibling("/"), "/index.md");
		assert.equal(getMarkdownSibling("/about"), "/about.md");
	});

	test("the response uses the negotiated media type and cache key", async () => {
		const response = await getMarkdownResponse(
			new Request("https://thisissaeed.com/api/markdown", {
				headers: {
					Accept: "text/markdown",
				},
			}),
			{
				params: Promise.resolve({}),
			},
		);

		assert.equal(response.status, 200);
		assert.equal(
			response.headers.get("Content-Type"),
			"text/markdown; charset=utf-8",
		);
		assert.equal(response.headers.get("Vary"), "Accept");
	});

	test("the response preserves a real 404 with recovery Markdown", async () => {
		const response = await getMarkdownResponse(
			new Request("https://thisissaeed.com/api/markdown/missing-page"),
			{
				params: Promise.resolve({
					path: [
						"missing-page",
					],
				}),
			},
		);

		assert.equal(response.status, 404);
		assert.match(await response.text(), /Agent index/);
	});
});

describe("llms.txt", () => {
	const llmsText = getLlmsText();

	test("follows the llms.txt document order", () => {
		assert.match(llmsText, /^# Muhammed Saeed\n\n> /);
		const whenToUse = llmsText.indexOf("When to use this site:");
		const firstFileList = llmsText.indexOf("## Start here");
		assert.ok(whenToUse > 0 && whenToUse < firstFileList);
	});

	test("provides explicit use and contact guidance", () => {
		assert.match(llmsText, /verify Muhammed Saeed's professional background/);
		assert.match(llmsText, /How to contact: email stringsaeed@gmail\.com/);
	});

	test("lists every article as an absolute Markdown link", () => {
		for (const post of posts) {
			assert.match(
				llmsText,
				new RegExp(
					`https://thisissaeed\\.com/blog/${post.slug.replaceAll("-", "\\-")}\\.md`,
				),
			);
		}
	});
});
