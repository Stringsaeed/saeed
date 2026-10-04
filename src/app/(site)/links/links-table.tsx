"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LinkEntry } from "@/data/links";

type LinksTableProps = {
  entries: readonly LinkEntry[];
};

function getFaviconUrl(url: string) {
  const faviconUrl = new URL("https://www.google.com/s2/favicons");
  faviconUrl.searchParams.set("domain_url", url);
  faviconUrl.searchParams.set("sz", "32");
  return faviconUrl.toString();
}

const tableClassName = "w-full min-w-208 table-fixed leading-5";

function ColumnGroup() {
  return (
    <colgroup>
      <col className="w-[23%]" />
      <col className="w-[13%]" />
      <col className="w-[26%]" />
      <col className="w-[38%]" />
    </colgroup>
  );
}

export function LinksTable({ entries }: LinksTableProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!scrollRoot || !header) return;

    const viewport = scrollRoot.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    const bodyTable = scrollRoot.querySelector("table");
    if (!viewport || !bodyTable) return;

    const sync = () => {
      header.style.width = `${bodyTable.offsetWidth}px`;
      header.style.transform = `translate3d(${-viewport.scrollLeft}px, 0, 0)`;
    };

    sync();
    viewport.addEventListener("scroll", sync, {
      passive: true,
    });
    const observer = new ResizeObserver(sync);
    observer.observe(bodyTable);
    observer.observe(viewport);

    return () => {
      viewport.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, [
    scrollRoot,
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative z-30 shrink-0 overflow-hidden bg-muted">
        <div ref={headerRef}>
          <Table className={tableClassName}>
            <caption className="sr-only">
              Column headings for saved websites and tools.
            </caption>
            <ColumnGroup />
            <TableHeader>
              <TableRow className="text-muted-foreground">
                <TableHead
                  className="bg-muted text-muted-foreground"
                  scope="col"
                >
                  Website
                </TableHead>
                <TableHead
                  className="bg-muted text-muted-foreground"
                  scope="col"
                >
                  Type
                </TableHead>
                <TableHead
                  className="bg-muted text-muted-foreground"
                  scope="col"
                >
                  URL
                </TableHead>
                <TableHead
                  className="bg-muted text-muted-foreground"
                  scope="col"
                >
                  Note
                </TableHead>
              </TableRow>
            </TableHeader>
          </Table>
        </div>
      </div>
      <ScrollArea
        ref={setScrollRoot}
        orientation="both"
        className="min-h-0 flex-1"
        viewportClassName="overscroll-contain scroll-fade"
      >
        <Table className={tableClassName}>
          <caption className="sr-only">
            Saved websites and tools with category, URL, and notes.
          </caption>
          <ColumnGroup />
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
                    data-sound="tap"
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
                    data-sound="tap"
                  >
                    {entry.url}
                  </a>
                </TableCell>
                <TableCell>{entry.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
