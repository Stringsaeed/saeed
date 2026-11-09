import type { Metadata } from "next";
import { AppWindow } from "@/components/os/app-window";
import { ListGroup, ListRow } from "@/components/os/os-list";
import { findBuiltInApp } from "@/data/apps";
import { getPosts } from "@/lib/content";
import { formatPostDate } from "@/lib/format-date";
import { siteName } from "@/lib/site";

const blogDescription =
  "Notes by Saeed on React Native, software engineering, and working with agents.";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
  title: "Writing",
  description: blogDescription,
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    type: "website",
    url: "/blog",
    title: `Writing | ${siteName}`,
    description: blogDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `Writing | ${siteName}`,
    description: blogDescription,
  },
};

function yearOf(date: string) {
  return new Date(date).getUTCFullYear();
}

export default async function BlogPage() {
  const posts = await getPosts();
  const years = [
    ...new Set(posts.map((post) => yearOf(post.date))),
  ];
  const app = findBuiltInApp("writing");
  return (
    <AppWindow
      app={app}
      title="Writing"
      lede="Notes on React Native, software engineering, and working with agents."
      analyticsLabel="Blog Archive"
    >
      {years.map((year) => (
        <ListGroup key={year} title={String(year)}>
          {posts
            .filter((post) => yearOf(post.date) === year)
            .map((post) => (
              <ListRow
                key={post.slug}
                href={`/blog/${post.slug}`}
                title={<span className="font-medium">{post.title}</span>}
                subtitle={post.description}
                clampSubtitle
                trailing={
                  <time className="text-[13px]" dateTime={post.date}>
                    {formatPostDate(post.date)}
                  </time>
                }
                chevron
                data-sound="tap"
                data-analytics-event="Blog Post Clicked"
                data-analytics-slug={post.slug}
                data-analytics-location="Blog Archive"
              />
            ))}
        </ListGroup>
      ))}
    </AppWindow>
  );
}
