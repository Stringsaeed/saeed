import type { Metadata } from "next";
import Image from "next/image";
import { AppWindow } from "@/components/os/app-window";
import { ListGroup, ListRow } from "@/components/os/os-list";
import { findBuiltInApp } from "@/data/apps";
import { getLinks, type LinkEntry } from "@/lib/content";
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

function faviconUrl(url: string) {
  const favicon = new URL("https://www.google.com/s2/favicons");
  favicon.searchParams.set("domain_url", url);
  favicon.searchParams.set("sz", "64");
  return favicon.toString();
}

function typeLabel(rawType: string) {
  const trimmed = rawType.trim();
  if (!trimmed) return "Other";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function groupByType(entries: readonly LinkEntry[]) {
  const groups = new Map<string, LinkEntry[]>();
  for (const entry of entries) {
    const label = typeLabel(entry.type);
    const list = groups.get(label) ?? [];
    list.push(entry);
    groups.set(label, list);
  }
  return [
    ...groups.entries(),
  ].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
}

export default async function LinksPage() {
  const entries = (await getLinks()).filter((entry) => isHttpsUrl(entry.url));
  const groups = groupByType(entries);
  const app = findBuiltInApp("links");
  return (
    <AppWindow
      app={app}
      title="Links"
      lede={`${entries.length} saved websites, tools, articles, and references I keep coming back to.`}
      analyticsLabel="Links Archive"
    >
      {groups.map(([label, items]) => (
        <ListGroup key={label} title={`${label} · ${items.length}`}>
          {items.map((entry) => (
            <ListRow
              key={entry.url}
              href={entry.url}
              external
              leading={
                <span className="grid size-9 place-items-center overflow-hidden rounded-[10px] bg-[color:var(--os-card-2)]">
                  <Image
                    src={faviconUrl(entry.url)}
                    alt=""
                    width={20}
                    height={20}
                    className="size-5"
                    unoptimized
                  />
                </span>
              }
              title={entry.website}
              subtitle={entry.description || new URL(entry.url).hostname}
              clampSubtitle
              chevron
              data-sound="tap"
              data-analytics-event="Saved Link Clicked"
              data-analytics-label={entry.website}
            />
          ))}
        </ListGroup>
      ))}
    </AppWindow>
  );
}
