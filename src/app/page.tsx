import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
	Card,
	CardDescription,
	CardFooter,
	CardGroup,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { formatPostDate, posts } from "@/content/blog/posts";

const work = [
	{
		company: "Thndr",
		period: "2025 to 2026",
		href: "https://thndr.app/",
		logo: "/work/thndr.png",
		brand: "#ffff00",
		description:
			"ADX order flows and shared market configuration for Egypt, US equities, and Abu Dhabi.",
	},
	{
		company: "Dubizzle",
		period: "2024 to 2025",
		href: "https://www.dubizzle.com/",
		logo: "/work/dubizzle.png",
		brand: "#ed0000",
		description:
			"Listings, stability, ratings, SDK upgrades, and billing across mobile and web.",
	},
	{
		company: "Nomo",
		period: "2023 to 2024",
		href: "https://nomobank.com/",
		logo: "/work/nomo.png",
		brand: "#bde8c6",
		description:
			"Digital banking for customers across Kuwait, the UAE, and the GCC.",
	},
	{
		company: "Breadfast",
		period: "2022 to 2023",
		href: "https://www.breadfast.com/",
		logo: "/work/breadfast.png",
		brand: "#b6008b",
		description:
			"Mobile reliability while the grocery product grew beyond one million active users.",
	},
];

export default function Home() {
	return (
		<main className="pb-20 pt-10 sm:pt-14">
			<h1
				className="max-w-[34rem] text-xl leading-8 font-semibold tracking-[-0.025em] sm:text-2xl sm:leading-9"
				data-analytics-view="Content Viewed"
				data-analytics-label="Intro"
			>
				I’m Saeed, a software engineer in Dubai.
			</h1>
			<p className="mt-3 max-w-[38rem] text-base leading-7 text-muted-foreground">
				I work on React Native, TypeScript, performance, accessibility, native
				code, and agent-assisted engineering.
			</p>

			<div
				className="mt-12"
				data-analytics-view="Content Viewed"
				data-analytics-label="Work"
			>
				<h2 className="list-heading">Work</h2>
				<CardGroup
					className="mt-4"
					orientation="inline"
					border="outlined"
					separated
				>
					{work.map((item) => (
						<Card
							key={item.company}
							className="bg-card/70 transition-colors duration-150 hover:bg-[color-mix(in_oklch,var(--work-brand)_12%,var(--background))] focus-within:bg-[color-mix(in_oklch,var(--work-brand)_12%,var(--background))]"
							href={item.href}
							external
							label={`${item.company}, ${item.period}`}
							size="compact"
							style={
								{
									"--work-brand": item.brand,
								} as CSSProperties
							}
							data-analytics-event="Work Link Clicked"
							data-analytics-company={item.company}
							data-analytics-location="Home"
						>
							<span className="relative size-5 shrink-0 overflow-hidden rounded-sm outline outline-1 -outline-offset-1 outline-foreground/10">
								<Image
									src={item.logo}
									alt=""
									width={20}
									height={20}
									sizes="20px"
									className="size-full object-cover grayscale opacity-70 transition-[filter,opacity] duration-150 group-hover/card:grayscale-0 group-hover/card:opacity-100 group-focus-within/card:grayscale-0 group-focus-within/card:opacity-100"
								/>
							</span>
							<CardHeader>
								<CardTitle>{item.company}</CardTitle>
								<CardDescription
									className="truncate leading-5"
									title={item.description}
								>
									{item.description}
								</CardDescription>
							</CardHeader>
							<CardFooter>
								<span className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
									{item.period}
								</span>
							</CardFooter>
						</Card>
					))}
				</CardGroup>
			</div>

			<div
				className="mt-12"
				data-analytics-view="Content Viewed"
				data-analytics-label="Writing"
			>
				<div className="flex items-baseline justify-between gap-5">
					<h2 className="list-heading">Writing</h2>
					<Link
						className="text-link text-sm text-muted-foreground"
						href="/blog"
						data-analytics-event="Navigation Clicked"
						data-analytics-destination="Blog"
						data-analytics-location="Home"
					>
						All posts
					</Link>
				</div>
				<ul className="mt-5 space-y-4">
					{posts.slice(0, 5).map((post) => (
						<li key={post.slug}>
							<Link
								className="group flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
								href={`/blog/${post.slug}`}
								data-analytics-event="Blog Post Clicked"
								data-analytics-slug={post.slug}
								data-analytics-location="Home"
							>
								<span className="text-sm font-medium underline-offset-4 group-hover:underline">
									{post.title}
								</span>
								<time
									className="shrink-0 font-mono text-xs text-muted-foreground"
									dateTime={post.date}
								>
									{formatPostDate(post.date)}
								</time>
							</Link>
						</li>
					))}
				</ul>
			</div>
		</main>
	);
}
