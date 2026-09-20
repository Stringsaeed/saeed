import type { Metadata } from "next";
import Link from "next/link";
import { formatPostDate, posts } from "@/content/blog/posts";
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

export default function BlogPage() {
	return (
		<main className="pb-20 pt-10 sm:pt-14">
			<h1
				className="text-2xl font-semibold tracking-[-0.035em]"
				data-analytics-view="Content Viewed"
				data-analytics-label="Blog Archive"
			>
				Blog
			</h1>
			<p className="mt-3 max-w-[36rem] text-sm leading-6 text-muted-foreground">
				Notes on React Native, software engineering, and working with agents.
			</p>

			<ol className="mt-8 space-y-6">
				{posts.map((post) => (
					<li key={post.slug}>
						<Link
							className="group block"
							href={`/blog/${post.slug}`}
							data-analytics-event="Blog Post Clicked"
							data-analytics-slug={post.slug}
							data-analytics-location="Blog Archive"
						>
							<div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
								<h2 className="font-medium tracking-[-0.015em] underline-offset-4 group-hover:underline">
									{post.title}
								</h2>
								<time
									className="shrink-0 font-mono text-xs text-muted-foreground"
									dateTime={post.date}
								>
									{formatPostDate(post.date)}
								</time>
							</div>
							<p className="mt-1 max-w-[38rem] text-sm leading-6 text-muted-foreground">
								{post.description}
							</p>
						</Link>
					</li>
				))}
			</ol>
		</main>
	);
}
