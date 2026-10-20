import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostBody } from "@/components/content/post-body";
import { SiteBackdrop } from "@/components/site-backdrop";
import { SiteHeader, SiteSocialLinks } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { withPewpewCaptions } from "@/explainers/pewpew/captions";
import { formatPostDate } from "@/lib/content";
import { parseLocalPost } from "@/lib/local-posts";

// The PewPew post draft (src/explainers/pewpew/post.mdx) rendered the way
// /blog/[slug] will render it once the Sanity draft is published, for
// review before publishing, with the captions the Sanity import attaches
// (src/explainers/pewpew/captions.ts). Dev only: production builds answer 404.
// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
  title: "PewPew post preview",
  robots: {
    index: false,
    follow: false,
  },
};

const postPath = path.join(process.cwd(), "src/explainers/pewpew/post.mdx");

export default function PewpewPostPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const post = parseLocalPost(
    "pewpew-source-tour",
    fs.readFileSync(postPath, "utf8"),
  );

  // Prototypes sit outside the (site) layout, so this repeats its frame
  // (backdrop, header, social links) and, below, the article markup of
  // src/app/(site)/blog/[slug]/page.tsx without the analytics attributes
  // and JSON-LD. Keep the two in sync when the blog page changes.
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="relative isolate min-h-screen overflow-x-clip">
        <SiteBackdrop />
        <div className="site-layout relative z-10 mx-auto flex min-h-dvh w-full max-w-176 flex-col px-6 sm:px-8">
          <SiteHeader />
          <main className="pb-24 pt-8 sm:pt-12">
            <Link
              className="text-link backdrop-plate text-sm text-muted-foreground"
              href="/prototypes/pewpew"
            >
              ← PewPew figures
            </Link>

            <article className="mt-8">
              <header>
                <p className="backdrop-plate font-mono text-xs text-muted-foreground">
                  <time dateTime={post.date}>
                    {formatPostDate(post.date, "full")}
                  </time>
                  <span aria-hidden="true"> · </span>
                  {post.tags.join(", ")}
                </p>
                <h1 className="backdrop-plate mt-3 max-w-[18ch] text-balance text-3xl leading-tight font-semibold tracking-[-0.045em] sm:text-4xl">
                  {post.title}
                </h1>
                <p className="backdrop-plate mt-4 max-w-[38rem] text-base leading-7 text-muted-foreground">
                  {post.description}
                </p>
              </header>

              <div className="article-body mt-10">
                <PostBody value={withPewpewCaptions(post.body)} />
              </div>
            </article>
          </main>
          <SiteSocialLinks />
        </div>
      </div>
    </ThemeProvider>
  );
}
