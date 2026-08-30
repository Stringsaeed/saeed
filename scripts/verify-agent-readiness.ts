import assert from "node:assert/strict";
import { posts } from "@/content/blog/posts";
import {
	getMarkdownSibling,
	publicPagePaths,
} from "@/lib/agent-content";

const baseUrl = new URL(process.argv[2] ?? "http://127.0.0.1:3000");

function urlFor(pathname: string) {
	return new URL(pathname, baseUrl);
}

function readableText(html: string) {
	return html
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
		.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
		.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/&(nbsp|amp|lt|gt|quot|#39);/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

async function request(pathname: string, accept?: string) {
	return fetch(urlFor(pathname), {
		headers: accept
			? {
					Accept: accept,
				}
			: undefined,
		redirect: "manual",
	});
}

async function verifyHtmlPages() {
	for (const pathname of publicPagePaths) {
		const response = await request(pathname, "text/html");
		const body = await response.text();
		assert.equal(response.status, 200, `${pathname} should return 200`);
		assert.match(
			response.headers.get("content-type") ?? "",
			/^text\/html/,
			`${pathname} should return HTML`,
		);
		assert.match(body, /<h1[ >]/, `${pathname} should include an H1`);
	}

	for (const pathname of [
		"/about",
		"/contact",
		"/privacy",
	]) {
		const response = await request(pathname, "text/html");
		const text = readableText(await response.text());
		assert.ok(text.length >= 500, `${pathname} has only ${text.length} chars`);
	}
}

async function verifyHomepageContent() {
	const response = await request("/", "text/html");
	const html = await response.text();
	const text = readableText(html);
	const ratio = text.length / html.length;

	assert.ok(text.length >= 500, `Homepage has only ${text.length} chars`);
	assert.ok(
		ratio >= 0.05,
		`Homepage content ratio is ${(ratio * 100).toFixed(1)}%`,
	);
	assert.match(text, /Muhammed Saeed/);

	return {
		characters: text.length,
		ratio,
	};
}

async function verifyMarkdownPages() {
	for (const pathname of publicPagePaths) {
		const negotiated = await request(pathname, "text/markdown");
		const negotiatedBody = await negotiated.text();
		assert.equal(negotiated.status, 200, `${pathname} Markdown should return 200`);
		assert.match(
			negotiated.headers.get("content-type") ?? "",
			/^text\/markdown; charset=utf-8$/,
		);
		assert.match(negotiated.headers.get("vary") ?? "", /(^|,\s*)Accept(,|$)/i);
		assert.match(negotiatedBody, /^# /);

		const sibling = await request(getMarkdownSibling(pathname));
		assert.equal(sibling.status, 200, `${pathname} .md sibling should return 200`);
		assert.match(
			sibling.headers.get("content-type") ?? "",
			/^text\/markdown; charset=utf-8$/,
		);
	}

	const unacceptable = await request("/", "application/pdf");
	assert.equal(unacceptable.status, 406);
	assert.match(unacceptable.headers.get("vary") ?? "", /Accept/i);
}

async function verifyNotFound() {
	const pathname = "/this-page-does-not-exist";
	const html = await request(pathname, "text/html");
	assert.equal(html.status, 404);
	assert.match(await html.text(), /Page not found/);

	const markdown = await request(pathname, "text/markdown");
	assert.equal(markdown.status, 404);
	assert.match(
		markdown.headers.get("content-type") ?? "",
		/^text\/markdown; charset=utf-8$/,
	);
	const body = await markdown.text();
	assert.match(body, /^# 404: Page not found/);
	assert.match(body, /\/llms\.txt/);
	assert.match(body, /\/sitemap\.xml/);
}

async function verifyMachineFiles() {
	const files = [
		{
			path: "/llms.txt",
			type: /^text\/plain/,
			body: /^# Muhammed Saeed/,
		},
		{
			path: "/robots.txt",
			type: /^text\/plain/,
			body: /Sitemap: https:\/\/thisissaeed\.com\/sitemap\.xml/,
		},
		{
			path: "/sitemap.xml",
			type: /^(application|text)\/xml/,
			body: /https:\/\/thisissaeed\.com\/privacy/,
		},
		{
			path: "/feed.xml",
			type: /^(application|text)\/rss\+xml/,
			body: /<rss version="2\.0"/,
		},
	] as const;

	for (const file of files) {
		const response = await request(file.path);
		const body = await response.text();
		assert.equal(response.status, 200, `${file.path} should return 200`);
		assert.match(response.headers.get("content-type") ?? "", file.type);
		assert.match(body, file.body);
	}

	const images = [
		"/opengraph-image",
		...posts.map((post) => `/blog/${post.slug}/opengraph-image`),
	];
	for (const pathname of images) {
		const response = await request(pathname);
		assert.equal(response.status, 200, `${pathname} should return 200`);
		assert.match(response.headers.get("content-type") ?? "", /^image\/png/);
	}
}

await verifyHtmlPages();
const homepage = await verifyHomepageContent();
await verifyMarkdownPages();
await verifyNotFound();
await verifyMachineFiles();

console.log(
	`Verified ${publicPagePaths.length} HTML pages, ${publicPagePaths.length} negotiated Markdown pages, ${publicPagePaths.length} Markdown siblings, 4 machine-readable files, ${posts.length + 1} Open Graph images, 404 recovery, and 406 negotiation.`,
);
console.log(
	`Homepage: ${homepage.characters} meaningful characters, ${(homepage.ratio * 100).toFixed(1)}% raw-HTML content ratio.`,
);
