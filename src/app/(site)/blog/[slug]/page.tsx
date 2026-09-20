import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostBody } from "@/components/content/post-body";
import { JsonLd } from "@/components/json-ld";
import { formatPostDate, getPost, getPosts } from "@/lib/content";
import { siteName } from "@/lib/site";
import { getBlogPostStructuredData } from "@/lib/structured-data";

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
    <main className="pb-24 pt-8 sm:pt-12">
      <JsonLd data={getBlogPostStructuredData(post)} />
      <Link
        className="text-link text-sm text-muted-foreground"
        href="/blog"
        data-analytics-event="Navigation Clicked"
        data-analytics-destination="Blog"
        data-analytics-location="Article"
      >
        ← Blog
      </Link>

      <article
        className="mt-8"
        data-analytics-article={post.slug}
        data-analytics-slug={post.slug}
      >
        <header
          data-analytics-view="Article Viewed"
          data-analytics-slug={post.slug}
        >
          <p className="font-mono text-xs text-muted-foreground">
            <time dateTime={post.date}>
              {formatPostDate(post.date, "full")}
            </time>
            <span aria-hidden="true"> · </span>
            {post.tags.join(", ")}
          </p>
          <h1 className="mt-3 max-w-[18ch] text-balance text-3xl leading-tight font-semibold tracking-[-0.045em] sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-4 max-w-[38rem] text-base leading-7 text-muted-foreground">
            {post.description}
          </p>
        </header>

        <div className="article-body mt-10">
          <PostBody value={post.body} />
        </div>
        <span
          className="block h-px"
          data-analytics-view="Article Completed"
          data-analytics-slug={post.slug}
          aria-hidden="true"
        />
      </article>
    </main>
  );
}
