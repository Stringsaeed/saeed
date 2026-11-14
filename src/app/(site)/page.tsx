import Link from "next/link";
import { ViewTransition } from "react";
import { BookShelf } from "@/components/book-shelf";
import { ProjectsShelf } from "@/components/cartridges/projects-shelf";
import { LocalClock } from "@/components/local-clock";
import { SaeedName } from "@/components/saeed-name";
import { SiteContactLinks } from "@/components/site-header";
import { WorkSentence } from "@/components/work-sentence";
import { getPosts } from "@/lib/content";

// An underlined word in a sentence; the line takes the company's colour on
// hover, mixed toward the text so a pale brand still shows on a light page.
// The ::after grows the target to 44px tall for a finger.
const INLINE_LINK =
  "relative text-foreground underline decoration-foreground/30 decoration-1 underline-offset-4 transition-[text-decoration-color] duration-150 after:absolute after:-inset-x-1 after:-inset-y-3 hover:decoration-[color-mix(in_oklab,var(--brand,currentColor)_70%,var(--foreground))] hover:decoration-2";

// A small pixel-type link to another page. The ::after grows the target for
// a finger without moving anything.
const PIXEL_LINK =
  "text-link relative font-(family-name:--font-pixel) text-[11px] tracking-wide text-muted-foreground uppercase after:absolute after:-inset-3";

// Vertical rhythm for the intro. Where the page fits one window it follows
// the window's height, so a short window keeps everything above its fold.
const GAP = "mt-5 fit:mt-[clamp(0.75rem,2.6vh,1.75rem)]";

export default async function Home() {
  const [latest] = await getPosts();
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {/* Two columns where the window can hold them, one window tall: the
          intro, its links and the books on the left, the shelf of
          cartridges on the right, and along the bottom the contact links
          and the local time (see the fit variant and data-layout-home in
          globals.css). Smaller windows stack them and scroll. */}
      <main
        className="flex flex-col gap-14 pt-8 pb-12 sm:pt-12 fit:grid fit:min-h-0 fit:flex-1 fit:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] fit:grid-rows-[minmax(0,1fr)_auto] fit:gap-x-16 fit:gap-y-8 fit:pt-[clamp(0.5rem,3vh,2.5rem)] fit:pb-8"
        data-layout-home
      >
        {/* Stacked on a wide window, the intro keeps a reading measure and
            the shelf its old width, rather than spanning the page. */}
        <div className="max-w-[40rem] fit:col-start-1 fit:row-start-1 fit:flex fit:min-h-0 fit:max-w-none fit:flex-col">
          <div className="blueprint-hero-frame">
            <div aria-hidden="true" className="blueprint-dimension-bar mb-3">
              <span className="blueprint-dimension-tick" />
              <span className="blueprint-dimension-line" />
              <span className="px-2 font-mono text-[10px] tracking-wider text-muted-foreground uppercase tabular-nums">
                COL W: 416PX (26REM) · SCALE 1:1
              </span>
              <span className="blueprint-dimension-line" />
              <span className="blueprint-dimension-tick" />
            </div>
            <h1
              className="backdrop-plate text-[1.75rem] leading-[1.2] font-semibold tracking-tight text-balance sm:text-[2.125rem] fit:text-[clamp(1.75rem,4.4vh,2.375rem)]"
              data-analytics-view="Content Viewed"
              data-analytics-label="Intro"
            >
              I’m <SaeedName />, a software engineer.
            </h1>
            <p
              className={`backdrop-plate text-base leading-7 text-muted-foreground ${GAP}`}
            >
              I work on React Native, TypeScript, performance, accessibility,
              native code, and agent-assisted engineering.
            </p>
          </div>

          <WorkSentence className={GAP} linkClassName={INLINE_LINK}>
            {latest ? (
              <>
                {" "}
                Latest post:{" "}
                <Link
                  className={INLINE_LINK}
                  href={`/blog/${latest.slug}`}
                  data-analytics-event="Blog Post Clicked"
                  data-analytics-slug={latest.slug}
                  data-analytics-location="Home"
                  data-sound="tap"
                >
                  {latest.title}
                </Link>
                {/[.?!]$/.test(latest.title) ? "" : "."}
              </>
            ) : null}
          </WorkSentence>

          {/* The office has its own page, where it has room. */}
          <p className={`flex flex-wrap gap-x-6 gap-y-6 ${GAP}`}>
            <Link
              className={PIXEL_LINK}
              href="/office"
              data-analytics-event="Navigation Clicked"
              data-analytics-destination="Office"
              data-analytics-location="Home"
              data-sound="tap"
            >
              Step into my office →
            </Link>
          </p>

          {/* The books, on one shelf in whatever height the column has left
              (see the home-books container in globals.css). */}
          <section
            className={`fit:min-h-0 fit:flex-1 fit:[container:home-books/size] ${GAP}`}
            data-analytics-view="Content Viewed"
            data-analytics-label="Library"
          >
            <h2
              className="list-heading backdrop-plate mb-5 fit:sr-only"
              data-bp-sec="01"
            >
              Library
            </h2>
            <BookShelf />
          </section>
        </div>

        <section
          className="max-w-[63rem] fit:col-start-2 fit:row-start-1 fit:min-h-0 fit:max-w-none fit:[container:shelf-panel/size]"
          data-analytics-view="Content Viewed"
          data-analytics-label="Projects"
        >
          <h2
            className="list-heading backdrop-plate fit:sr-only"
            data-bp-sec="02"
          >
            Projects
          </h2>
          <ProjectsShelf fit className="mt-4 fit:mt-0" />
        </section>

        <SiteContactLinks className="fit:col-start-1 fit:row-start-2 fit:self-end" />

        {/* Where I am and the time there, in the bottom right corner,
            across from the contact links. */}
        <p className="backdrop-plate self-end text-right font-mono text-sm leading-6 text-muted-foreground tabular-nums fit:col-start-2 fit:row-start-2 fit:justify-self-end">
          Dubai, UAE
          <br />
          <LocalClock />
        </p>
      </main>
    </ViewTransition>
  );
}
