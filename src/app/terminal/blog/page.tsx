import type { Metadata } from "next";
import Link from "next/link";
import { TERMINAL } from "@/components/terminal/paths";
import { TabPage } from "@/components/terminal/tab-page";
import { tabStyles } from "@/components/terminal/tab-styles";
import { formatPostDate, getPosts } from "@/lib/content";
import { siteName } from "@/lib/site";

const blogDescription =
  "Notes by Saeed on React Native, software engineering, and working with agents.";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
  title: "Blog",
  description: blogDescription,
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    type: "website",
    url: "/blog",
    title: `Blog | ${siteName}`,
    description: blogDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `Blog | ${siteName}`,
    description: blogDescription,
  },
};

export default async function BlogPage() {
  const posts = await getPosts();
  return (
    <TabPage command="git log writing" note={`${posts.length} posts`} wide>
      <h1
        className={tabStyles.big}
        data-analytics-view="Content Viewed"
        data-analytics-label="Blog Archive"
      >
        Blog
      </h1>
      <p className={tabStyles.lede}>
        Notes on React Native, software engineering, and working with agents.
      </p>

      <ol className={tabStyles.posts}>
        {posts.map((post) => (
          <li key={post.slug}>
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            <div>
              <h2>
                <Link
                  href={`${TERMINAL}/blog/${post.slug}`}
                  data-analytics-event="Blog Post Clicked"
                  data-analytics-slug={post.slug}
                  data-analytics-location="Blog Archive"
                >
                  {post.title}
                </Link>
              </h2>
              <p>{post.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </TabPage>
  );
}
