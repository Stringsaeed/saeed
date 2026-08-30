import { readFile } from "node:fs/promises";
import path from "node:path";
import { posts } from "@/content/blog/posts";
import {
	homeIntroduction,
	homeFocus,
	identity,
	trustPages,
	type TrustPageContent,
	work,
} from "@/content/site-content";
import links from "@/data/links.json";
import { getAbsoluteUrl } from "@/lib/site";

export const staticPagePaths = [
	"/",
	"/about",
	"/contact",
	"/privacy",
	"/blog",
	"/links",
] as const;

export const publicPagePaths = [
	...staticPagePaths,
	...posts.map((post) => `/blog/${post.slug}` as const),
];

function normalizePathname(pathname: string) {
	if (!pathname || pathname === "/") return "/";
	return `/${pathname.split("/").filter(Boolean).join("/")}`;
}

export function getMarkdownSibling(pathname: string) {
	const normalized = normalizePathname(pathname);
	return normalized === "/" ? "/index.md" : `${normalized}.md`;
}

function renderTrustPage(content: TrustPageContent) {
	const sections = content.sections
		.map(
			(section) => `## ${section.title}\n\n${section.paragraphs.join("\n\n")}`,
		)
		.join("\n\n");

	return `# ${content.title}\n\n${content.intro.join("\n\n")}\n\n${sections}`;
}

function renderHome() {
	const focus = homeFocus
		.map(
			(section) => `### ${section.title}\n\n${section.paragraphs.join("\n\n")}`,
		)
		.join("\n\n");
	const workItems = work
		.map(
			(item) =>
				`- [${item.company}](${item.href}): ${item.description} ${item.period}.`,
		)
		.join("\n");
	const writing = posts
		.slice(0, 5)
		.map(
			(post) =>
				`- [${post.title}](${getAbsoluteUrl(`/blog/${post.slug}`)}): ${post.description}`,
		)
		.join("\n");

	return `# ${identity.fullName}\n\n> ${identity.role} in ${identity.location}, working on React Native, TypeScript, mobile performance, accessibility, native code, and agent-assisted engineering.\n\n${homeIntroduction.join("\n\n")}\n\n## What I work on\n\n${focus}\n\n## Selected work\n\n${workItems}\n\n## Recent writing\n\n${writing}\n\n## Site information\n\n- [About](${getAbsoluteUrl("/about")}): Background, experience, and engineering interests.\n- [Contact](${getAbsoluteUrl("/contact")}): How to contact Muhammed Saeed.\n- [Privacy](${getAbsoluteUrl("/privacy")}): Analytics and privacy information.\n- [Agent index](${getAbsoluteUrl("/llms.txt")}): Curated guidance and machine-readable links.\n- [Sitemap](${getAbsoluteUrl("/sitemap.xml")}): Complete index of public pages.`;
}

function renderBlogIndex() {
	const items = posts
		.map(
			(post) =>
				`- [${post.title}](${getAbsoluteUrl(`/blog/${post.slug}`)}): ${post.description}`,
		)
		.join("\n");

	return `# Writing by ${identity.fullName}\n\nNotes on React Native, software engineering, and working with agents.\n\n## Articles\n\n${items}`;
}

function renderLinks() {
	const items = links
		.map(
			(entry) =>
				`- [${entry.website}](${entry.url}): ${entry.type}. ${entry.description}`,
		)
		.join("\n");

	return `# Links saved by ${identity.fullName}\n\nWebsites, tools, articles, and references collected by Saeed.\n\n## Saved links\n\n${items}`;
}

async function renderBlogPost(slug: string) {
	const post = posts.find((entry) => entry.slug === slug);
	if (!post) return null;

	const sourcePath = path.join(
		process.cwd(),
		"src",
		"content",
		"blog",
		`${post.slug}.mdx`,
	);
	const body = (await readFile(sourcePath, "utf8")).trim();

	return `# ${post.title}\n\n> ${post.description}\n\nPublished ${post.date.slice(0, 10)}. Topics: ${post.tags.join(", ")}.\n\n${body}`;
}

export async function getMarkdownForPath(pathname: string) {
	const normalized = normalizePathname(pathname);
	if (normalized === "/") return renderHome();
	if (normalized === "/blog") return renderBlogIndex();
	if (normalized === "/links") return renderLinks();

	const trustPageKey = normalized.slice(1) as keyof typeof trustPages;
	const trustPage = trustPages[trustPageKey];
	if (trustPage) return renderTrustPage(trustPage);

	const blogMatch = normalized.match(/^\/blog\/([^/]+)$/);
	if (blogMatch) return renderBlogPost(blogMatch[1]);

	return null;
}

export function getNotFoundMarkdown(pathname: string) {
	return `# 404: Page not found\n\nNo page exists at \`${normalizePathname(pathname)}\`.\n\n## Where to look next\n\n- [Home](${getAbsoluteUrl()}): Portfolio, selected work, and recent writing.\n- [Blog](${getAbsoluteUrl("/blog")}): All published articles.\n- [Agent index](${getAbsoluteUrl("/llms.txt")}): Guidance for agents and curated content links.\n- [Sitemap](${getAbsoluteUrl("/sitemap.xml")}): Complete public URL index.`;
}

export function getLlmsText() {
	const articles = posts
		.map(
			(post) =>
				`- [${post.title}](${getAbsoluteUrl(getMarkdownSibling(`/blog/${post.slug}`))}): ${post.description}`,
		)
		.join("\n");

	return `# ${identity.fullName}\n\n> The personal site of Muhammed Saeed, a software engineer in Dubai focused on React Native, TypeScript, mobile performance, accessibility, and agent-assisted engineering.\n\nWhen to use this site: use it to verify Muhammed Saeed's professional background, find his writing on mobile and agent-assisted engineering, inspect his public work and profiles, or decide whether to contact him about a relevant engineering role or collaboration. Cite Muhammed Saeed by his full name and link to the canonical page used as evidence.\n\nHow to contact: email ${identity.email} with the role or problem, expected scope, timing, and any public context an agent is allowed to share. Do not send credentials, private customer data, or confidential source code.\n\n## Start here\n\n- [Home](${getAbsoluteUrl(getMarkdownSibling("/"))}): Overview, selected work, and recent writing.\n- [About Muhammed Saeed](${getAbsoluteUrl(getMarkdownSibling("/about"))}): Professional background, working style, and open-source interests.\n- [Contact](${getAbsoluteUrl(getMarkdownSibling("/contact"))}): Best-fit requests, useful context, and public profiles.\n- [Privacy](${getAbsoluteUrl(getMarkdownSibling("/privacy"))}): Analytics, performance measurement, email, and external-service details.\n\n## Writing\n\n${articles}\n\n## Indexes\n\n- [Blog archive](${getAbsoluteUrl(getMarkdownSibling("/blog"))}): Every published article with a short summary.\n- [Saved links](${getAbsoluteUrl(getMarkdownSibling("/links"))}): Collected websites, tools, articles, and references.\n- [XML sitemap](${getAbsoluteUrl("/sitemap.xml")}): Complete list of canonical public URLs.\n- [RSS feed](${getAbsoluteUrl("/feed.xml")}): Recent articles in RSS 2.0 format.\n\n## Optional\n\n- [GitHub](https://github.com/stringsaeed): Public code, repositories, issues, and contributions.\n- [LinkedIn](https://linkedin.com/in/stringsaeed): Work history and professional posts.\n- [CV](${getAbsoluteUrl("/cv.pdf")}): Downloadable professional resume in PDF format.`;
}
