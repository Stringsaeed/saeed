import { getPosts } from "@/lib/content";
import { getAbsoluteUrl, siteDescription, siteName } from "@/lib/site";

const xmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => xmlEntities[character]);
}

function rssDate(value: string) {
  return new Date(value).toUTCString();
}

export async function GET() {
  const posts = await getPosts();
  const feedUrl = getAbsoluteUrl("/feed.xml");
  const latestDate = posts[0]?.date ?? "2026-08-30T00:00:00.000Z";
  const items = posts
    .map((post) => {
      const url = getAbsoluteUrl(`/blog/${post.slug}`);
      const categories = post.tags
        .map((tag) => `      <category>${escapeXml(tag)}</category>`)
        .join("\n");

      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <description>${escapeXml(post.description)}</description>`,
        `      <pubDate>${rssDate(post.date)}</pubDate>`,
        categories,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${getAbsoluteUrl()}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en-US</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${rssDate(latestDate)}</lastBuildDate>
    <generator>Next.js</generator>
${items}
  </channel>
</rss>
`;

  return new Response(feed, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
