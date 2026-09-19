import type { BlogPost } from "@/content/blog/posts";
import {
	getAbsoluteUrl,
	siteDescription,
	siteName,
	socialProfiles,
} from "@/lib/site";

const personId = `${getAbsoluteUrl()}#person`;
const websiteId = `${getAbsoluteUrl()}#website`;

export function getRootStructuredData() {
	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@id": personId,
				"@type": "Person",
				name: siteName,
				url: getAbsoluteUrl(),
				jobTitle: "Software Engineer",
				description: siteDescription,
				knowsAbout: [
					"React Native",
					"TypeScript",
					"Mobile performance",
					"Accessibility",
					"Native mobile development",
				],
				sameAs: socialProfiles,
			},
			{
				"@id": websiteId,
				"@type": "WebSite",
				name: siteName,
				description: siteDescription,
				url: getAbsoluteUrl(),
				inLanguage: "en-US",
				author: {
					"@id": personId,
				},
				publisher: {
					"@id": personId,
				},
			},
		],
	};
}

export function getBlogPostStructuredData(post: BlogPost) {
	const url = getAbsoluteUrl(`/blog/${post.slug}`);

	return {
		"@context": "https://schema.org",
		"@id": `${url}#article`,
		"@type": "BlogPosting",
		headline: post.title,
		description: post.description,
		url,
		datePublished: post.date,
		dateModified: post.date,
		inLanguage: "en-US",
		articleSection: post.tags,
		keywords: post.tags,
		image: getAbsoluteUrl(`/blog/${post.slug}/opengraph-image`),
		mainEntityOfPage: {
			"@id": url,
			"@type": "WebPage",
		},
		isPartOf: {
			"@id": websiteId,
		},
		author: {
			"@id": personId,
			"@type": "Person",
			name: siteName,
			url: getAbsoluteUrl(),
		},
		publisher: {
			"@id": personId,
			"@type": "Person",
			name: siteName,
			url: getAbsoluteUrl(),
		},
	};
}
