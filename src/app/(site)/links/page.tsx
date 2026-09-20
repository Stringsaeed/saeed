import type { Metadata } from "next";
import { SaeedName } from "@/components/saeed-name";
import { getLinks } from "@/lib/content";
import { isHttpsUrl } from "@/lib/https-url";
import { siteName } from "@/lib/site";
import { LinksTable } from "./links-table";

function linksDescription(count: number) {
  return `${count} saved websites, tools, articles, and references collected by Saeed.`;
}

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export async function generateMetadata(): Promise<Metadata> {
  const entries = (await getLinks()).filter((entry) => isHttpsUrl(entry.url));
  const description = linksDescription(entries.length);

  return {
    title: "Links",
    description,
    alternates: {
      canonical: "/links",
    },
    openGraph: {
      type: "website",
      url: "/links",
      title: `Links | ${siteName}`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `Links | ${siteName}`,
      description,
    },
  };
}

export default async function LinksPage() {
  const entries = (await getLinks()).filter((entry) => isHttpsUrl(entry.url));
  return (
    <main
      className="flex min-h-0 flex-1 flex-col pb-4 pt-6 sm:pb-6 sm:pt-8"
      data-layout-fill
    >
      <div className="shrink-0">
        <h1
          className="text-2xl font-semibold tracking-[-0.035em]"
          data-analytics-view="Content Viewed"
          data-analytics-label="Links Archive"
        >
          Links
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          {entries.length} saved websites, tools, articles, and references
          collected by <SaeedName />.
        </p>
      </div>

      <div
        className="relative left-1/2 mt-6 min-h-0 w-[min(56rem,calc(100vw-1.5rem))] -translate-x-1/2 flex-1 overflow-hidden rounded-lg bg-background ring-1 ring-border  smooth-shadow-ring shadow-black smooth-ring-neutral-300/30"
        data-sticker-protected
      >
        <LinksTable entries={entries} />
      </div>
    </main>
  );
}
