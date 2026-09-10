import type { Metadata } from "next";
import Image from "next/image";
import { SaeedName } from "@/components/saeed-name";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import links from "@/data/links.json";
import { siteName } from "@/lib/site";

type LinkEntry = {
  website: string;
  type: string;
  url: string;
  description: string;
};

const entries = links satisfies LinkEntry[];
const description = `${entries.length} saved websites, tools, articles, and references collected by Saeed.`;

function getFaviconUrl(url: string) {
  const faviconUrl = new URL("https://www.google.com/s2/favicons");
  faviconUrl.searchParams.set("domain_url", url);
  faviconUrl.searchParams.set("sz", "32");
  return faviconUrl.toString();
}

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
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

export default function LinksPage() {
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
        className="relative left-1/2 mt-6 min-h-0 w-[min(56rem,calc(100vw-1.5rem))] -translate-x-1/2 flex-1 overflow-hidden rounded-lg bg-background ring-1 ring-border"
        data-sticker-protected
      >
        <div className="h-full min-h-0 overflow-auto overscroll-contain">
          <Table className="min-w-208 table-fixed leading-5">
            <caption className="sr-only">
              Saved websites and tools with category, URL, and notes.
            </caption>
            <colgroup>
              <col className="w-[23%]" />
              <col className="w-[13%]" />
              <col className="w-[26%]" />
              <col className="w-[38%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="z-30 text-muted-foreground">
                <TableHead
                  className="sticky top-0 z-20 bg-muted text-muted-foreground"
                  scope="col"
                >
                  Website
                </TableHead>
                <TableHead
                  className="sticky top-0 z-20 bg-muted text-muted-foreground"
                  scope="col"
                >
                  Type
                </TableHead>
                <TableHead
                  className="sticky top-0 z-20 bg-muted text-muted-foreground"
                  scope="col"
                >
                  URL
                </TableHead>
                <TableHead
                  className="sticky top-0 z-20 bg-muted text-muted-foreground"
                  scope="col"
                >
                  Note
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, index) => (
                <TableRow
                  key={entry.url}
                  index={index}
                  className="align-top last:border-b-0"
                >
                  <TableCell className="font-medium text-foreground">
                    <a
                      className="text-link flex items-start gap-2 underline-offset-4 hover:underline"
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer"
                      data-analytics-event="Saved Link Clicked"
                      data-analytics-label={entry.website}
                      data-analytics-type={entry.type}
                      data-analytics-location="Links Archive"
                    >
                      <Image
                        src={getFaviconUrl(entry.url)}
                        alt=""
                        width={16}
                        height={16}
                        className="mt-0.5 size-4 shrink-0 rounded-[3px]"
                        unoptimized
                      />
                      <span>{entry.website}</span>
                    </a>
                  </TableCell>
                  <TableCell>{entry.type}</TableCell>
                  <TableCell>
                    <a
                      className="block truncate text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground"
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer"
                      title={entry.url}
                      data-analytics-event="Saved Link Clicked"
                      data-analytics-label={entry.website}
                      data-analytics-type={entry.type}
                      data-analytics-location="Links Archive"
                    >
                      {entry.url}
                    </a>
                  </TableCell>
                  <TableCell>{entry.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  );
}
