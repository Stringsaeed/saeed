import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostBody } from "@/components/content/post-body";
import { TERMINAL } from "@/components/terminal/paths";
import { TabPage } from "@/components/terminal/tab-page";
import { tabStyles } from "@/components/terminal/tab-styles";
import { formatPostDate, getPost, getPosts } from "@/lib/content";
import { siteName } from "@/lib/site";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js uses this export to prerender known posts without blocking new ones.
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return {
    title: post.title,
    description: post.description,
    authors: [
      {
        name: siteName,
        url: "/",
      },
    ],
    alternates: {
      canonical: `/blog/${post.slug}`,
      types: {
        "text/markdown": `/blog/${post.slug}/markdown`,
      },
    },
    openGraph: {
      type: "article",
      url: `/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.date,
      authors: [
        siteName,
      ],
      tags: [
        ...post.tags,
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <TabPage command={`git show writing:${post.slug}.md`}>
      <article
        data-analytics-article={post.slug}
        data-analytics-slug={post.slug}
      >
        <header
          data-analytics-view="Article Viewed"
          data-analytics-slug={post.slug}
        >
          <dl className={tabStyles.fields}>
            <div>
              <dt>Date:</dt>
              <dd>
                <time dateTime={post.date}>
                  {formatPostDate(post.date, "full")}
                </time>
              </dd>
            </div>
            <div>
              <dt>Tags:</dt>
              <dd>{post.tags.join(", ")}</dd>
            </div>
          </dl>
          <h1 className={tabStyles.big}>{post.title}</h1>
          <p className={tabStyles.lede}>{post.description}</p>
        </header>

        <div className={`article-body ${tabStyles.article}`}>
          <PostBody value={post.body} />
        </div>
        <span
          className="block h-px"
          data-analytics-view="Article Completed"
          data-analytics-slug={post.slug}
          aria-hidden="true"
        />
        <p className={tabStyles.end}>
          (END){" "}
          <Link
            href={`${TERMINAL}/blog`}
            data-analytics-event="Navigation Clicked"
            data-analytics-destination="Blog"
            data-analytics-location="Article"
          >
            every post
          </Link>
        </p>
      </article>
    </TabPage>
  );
}
