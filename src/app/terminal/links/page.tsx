import type { Metadata } from "next";
import { TabPage } from "@/components/terminal/tab-page";
import { tabStyles } from "@/components/terminal/tab-styles";
import { getLinks } from "@/lib/content";
import { isHttpsUrl } from "@/lib/https-url";
import { siteName } from "@/lib/site";

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
    <TabPage
      command="git stash show links"
      note={`${entries.length} saved`}
      wide
    >
      <h1
        className={tabStyles.big}
        data-analytics-view="Content Viewed"
        data-analytics-label="Links Archive"
      >
        Links
      </h1>
      <p className={tabStyles.lede}>{linksDescription(entries.length)}</p>

      <ul className={tabStyles.archive}>
        {entries.map((entry) => (
          <li key={entry.url}>
            <a
              href={entry.url}
              target="_blank"
              rel="noreferrer"
              title={entry.description || undefined}
              data-analytics-event="Saved Link Clicked"
              data-analytics-label={entry.website}
              data-analytics-type={entry.type}
              data-analytics-location="Links Archive"
            >
              {entry.website}
            </a>
            <span>{entry.type.toLowerCase()}</span>
          </li>
        ))}
      </ul>
    </TabPage>
  );
}
