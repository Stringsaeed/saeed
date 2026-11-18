import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLinks, getPosts } from "@/lib/content";
import { isHttpsUrl } from "@/lib/https-url";
import { Directions } from "./directions";

// Five directions for a one-page site that reads as a software developer's,
// one rough variant each, all holding the same real content. For choosing a
// direction before anything is built. Dev only: production answers 404.
// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
  title: "Direction prototypes",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DirectionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    v?: string | string[];
  }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const [posts, links, params] = await Promise.all([
    getPosts(),
    getLinks(),
    searchParams,
  ]);
  const saved = links.filter((entry) => isHttpsUrl(entry.url));
  const initial = typeof params.v === "string" ? params.v : undefined;
  return (
    <Directions
      initial={initial}
      data={{
        posts: posts.map((post) => ({
          slug: post.slug,
          title: post.title,
          date: post.date,
          description: post.description,
          tags: post.tags,
        })),
        linkCount: saved.length,
        linkSample: saved.slice(0, 6).map((entry) => ({
          website: entry.website,
          type: entry.type,
          url: entry.url,
        })),
        links: saved.map((entry) => ({
          website: entry.website,
          type: entry.type,
          url: entry.url,
        })),
      }}
    />
  );
}
