import type { MetadataRoute } from "next";
import { posts } from "@/content/blog/posts";
import { getAbsoluteUrl } from "@/lib/site";

const siteUpdatedAt = new Date("2026-08-30T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
	const latestPostDate = posts[0]?.date ?? siteUpdatedAt;
	const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
		url: getAbsoluteUrl(`/blog/${post.slug}`),
		lastModified: new Date(post.date),
		changeFrequency: "monthly",
		priority: 0.7,
	}));

	return [
		{
			url: getAbsoluteUrl(),
			lastModified: siteUpdatedAt,
			changeFrequency: "monthly",
			priority: 1,
		},
		{
			url: getAbsoluteUrl("/blog"),
			lastModified: new Date(latestPostDate),
			changeFrequency: "weekly",
			priority: 0.8,
		},
		{
			url: getAbsoluteUrl("/about"),
			lastModified: siteUpdatedAt,
			changeFrequency: "yearly",
			priority: 0.8,
		},
		{
			url: getAbsoluteUrl("/contact"),
			lastModified: siteUpdatedAt,
			changeFrequency: "yearly",
			priority: 0.6,
		},
		{
			url: getAbsoluteUrl("/privacy"),
			lastModified: siteUpdatedAt,
			changeFrequency: "yearly",
			priority: 0.5,
		},
		{
			url: getAbsoluteUrl("/links"),
			lastModified: siteUpdatedAt,
			changeFrequency: "monthly",
			priority: 0.6,
		},
		...postEntries,
	];
}
