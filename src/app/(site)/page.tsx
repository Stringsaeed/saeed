import Link from "next/link";
import { ViewTransition } from "react";
import { BookShelf } from "@/components/book-shelf";
import { ProjectsShelf } from "@/components/cartridges/projects-shelf";
import { SaeedName } from "@/components/saeed-name";
import {
  Card,
  CardDescription,
  CardFooter,
  CardGroup,
  CardHeader,
  CardMedia,
  CardTitle,
} from "@/components/ui/card";
import { formatPostDate, getPosts } from "@/lib/content";

const work = [
  {
    company: "Aquanow",
    period: "Apr 2026 to Sep 2026",
    href: "https://aquanow.io/",
    logo: "/work/aquanow.png",
    brand: "#3FA2F0",
    description:
      "React Native and TypeScript on digital-asset infrastructure and liquidity.",
  },
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

export default async function Home() {
  const posts = await getPosts();
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <main className="pb-20 pt-10 sm:pt-14" data-layout-wide>
        <div className="blueprint-hero-frame">
          <div aria-hidden="true" className="blueprint-dimension-bar mb-3">
            <span className="blueprint-dimension-tick" />
            <span className="blueprint-dimension-line" />
            <span className="px-2 font-mono text-[10px] tracking-wider text-muted-foreground uppercase tabular-nums">
              COL MAX-W: 1008PX (63REM) · SCALE 1:1
            </span>
            <span className="blueprint-dimension-line" />
            <span className="blueprint-dimension-tick" />
          </div>
          <h1
            className="backdrop-plate max-w-136 text-xl leading-8 font-semibold tracking-tight sm:text-2xl sm:leading-9"
            data-analytics-view="Content Viewed"
            data-analytics-label="Intro"
          >
            I’m <SaeedName />, a software engineer.
          </h1>
          <p className="backdrop-plate mt-3 max-w-152 text-base leading-7 text-muted-foreground">
            I work on React Native, TypeScript, performance, accessibility,
            native code, and agent-assisted engineering.
          </p>
        </div>

        {/* The office has its own page now, where it has room. */}
        <p className="mt-5">
          <Link
            className="text-link relative font-(family-name:--font-pixel) text-[11px] tracking-wide text-muted-foreground uppercase after:absolute after:-inset-3"
            href="/office"
            data-analytics-event="Navigation Clicked"
            data-analytics-destination="Office"
            data-analytics-location="Home"
            data-sound="tap"
          >
            Step into my office →
          </Link>
        </p>

        <div
          className="mt-12"
          data-analytics-view="Content Viewed"
          data-analytics-label="Work"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="list-heading backdrop-plate" data-bp-sec="02">
              Work
            </h2>
            <span aria-hidden="true" className="blueprint-redline">
              ↙ oklab 12% proximity highlight
            </span>
          </div>
          <CardGroup
            className="mt-4 smooth-shadow-ring shadow-black smooth-ring-neutral-300/30 bg-background"
            orientation="inline"
            border="outlined"
          >
            {work.map((item) => (
              <Card
                key={item.company}
                href={item.href}
                external
                label={`${item.company}, ${item.period}`}
                size="compact"
                highlightColor={`color-mix(in oklab, ${item.brand} 12%, var(--background))`}
                className="flex-wrap sm:flex-nowrap"
                data-analytics-event="Work Link Clicked"
                data-analytics-company={item.company}
                data-analytics-location="Home"
                data-sound="tap"
                data-sound-hover="hover"
              >
                <CardMedia
                  logo={item.logo}
                  className="grayscale opacity-70 transition-[filter,opacity] duration-150 group-hover/card:grayscale-0 group-hover/card:opacity-100 group-focus-within/card:grayscale-0 group-focus-within/card:opacity-100"
                />
                {/* Like Projects: on phones the description wraps to two
                    lines and the dates drop under it, since beside them it
                    had room for about twenty characters. */}
                <CardHeader className="max-sm:pr-3">
                  <CardTitle>{item.company}</CardTitle>
                  <CardDescription
                    className="line-clamp-2 leading-5 sm:line-clamp-none sm:truncate"
                    title={item.description}
                  >
                    {item.description}
                  </CardDescription>
                </CardHeader>
                {/* The footer sits above the card's link and holds nothing
                    to press, so it lets taps through to the card. */}
                <CardFooter className="pointer-events-none max-sm:ml-0 max-sm:basis-full max-sm:-mt-4 max-sm:pb-2.5 max-sm:pl-8">
                  <span
                    aria-hidden="true"
                    className="blueprint-spec-chip mr-1.5"
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{
                        backgroundColor: item.brand,
                      }}
                    />
                    {item.brand.toUpperCase()}
                  </span>
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
          data-analytics-label="Projects"
        >
          <h2 className="list-heading backdrop-plate" data-bp-sec="03">
            Projects
          </h2>
          <div className="mt-4">
            <ProjectsShelf />
          </div>
        </div>

        <div
          className="mt-12"
          data-analytics-view="Content Viewed"
          data-analytics-label="Writing"
        >
          <div className="flex items-baseline justify-between gap-5">
            <h2 className="list-heading backdrop-plate" data-bp-sec="04">
              Writing
            </h2>
            {/* The text is 20px tall; the invisible ::after grows the target
                to 44px for a finger without moving anything. */}
            <Link
              className="text-link relative text-sm text-muted-foreground after:absolute after:-inset-3"
              href="/blog"
              data-analytics-event="Navigation Clicked"
              data-analytics-destination="Blog"
              data-analytics-location="Home"
              data-sound="tap"
            >
              All posts
            </Link>
          </div>
          <ul className="mt-5 space-y-4">
            {posts.slice(0, 5).map((post) => (
              <li key={post.slug}>
                <Link
                  className="group flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3"
                  href={`/blog/${post.slug}`}
                  data-analytics-event="Blog Post Clicked"
                  data-analytics-slug={post.slug}
                  data-analytics-location="Home"
                  data-sound="tap"
                >
                  <span className="text-sm font-medium underline-offset-4 group-hover:underline">
                    {post.title}
                  </span>
                  <span aria-hidden="true" className="blueprint-leader" />
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

        <div
          className="mt-12"
          data-analytics-view="Content Viewed"
          data-analytics-label="Library"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="list-heading backdrop-plate" data-bp-sec="05">
              Library
            </h2>
            <span aria-hidden="true" className="blueprint-redline">
              ↙ pull any spine → 3D CAD mesh
            </span>
          </div>
          <div className="mt-5">
            <BookShelf />
          </div>
        </div>
      </main>
    </ViewTransition>
  );
}
