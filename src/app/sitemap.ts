import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/content";
import { getAbsoluteUrl } from "@/lib/site";

const siteUpdatedAt = new Date("2026-08-30T00:00:00.000Z");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts();
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
      url: getAbsoluteUrl("/links"),
      lastModified: siteUpdatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...postEntries,
  ];
}
