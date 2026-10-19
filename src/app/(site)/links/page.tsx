import type { Metadata } from "next";
import { ViewTransition } from "react";
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
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <main className="flex flex-1 flex-col pb-12 pt-6 sm:pb-16 sm:pt-8">
        <div>
          <h1
            className="backdrop-plate text-2xl font-semibold tracking-[-0.035em]"
            data-analytics-view="Content Viewed"
            data-analytics-label="Links Archive"
          >
            Links
          </h1>
          <p className="backdrop-plate mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            {entries.length} saved websites, tools, articles, and references
            collected by <SaeedName />.
          </p>
        </div>

        <LinksTable entries={entries} />
      </main>
    </ViewTransition>
  );
}
