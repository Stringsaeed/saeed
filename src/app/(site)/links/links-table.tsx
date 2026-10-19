"use client";

import {
  RiArrowRightUpLine,
  RiCloseLine,
  RiSearchLine,
} from "@remixicon/react";
import Image from "next/image";
import {
  type ChangeEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FluidHoverHighlight } from "@/components/fluid-hover-highlight";
import type { LinkEntry } from "@/data/links";
import {
  useFluidHover,
  useRegisterFluidHoverItem,
} from "@/hooks/use-fluid-hover";
import { cn } from "@/lib/utils";

type LinksTableProps = {
  entries: readonly LinkEntry[];
};

type LinkMacroGroup =
  | "Galleries & Showcases"
  | "Tools & Libraries"
  | "Portfolios & People"
  | "Reading & Reference"
  | "Careers & Roles";

const MACRO_GROUPS: readonly LinkMacroGroup[] = [
  "Galleries & Showcases",
  "Tools & Libraries",
  "Portfolios & People",
  "Reading & Reference",
  "Careers & Roles",
];

type NormalizedLinkEntry = LinkEntry & {
  normalizedType: string;
  group: LinkMacroGroup;
  domain: string;
};

function getFaviconUrl(url: string) {
  const faviconUrl = new URL("https://www.google.com/s2/favicons");
  faviconUrl.searchParams.set("domain_url", url);
  faviconUrl.searchParams.set("sz", "32");
  return faviconUrl.toString();
}

function normalizeTypeLabel(rawType: string): string {
  const trimmed = rawType.trim();
  if (!trimmed) return "Link";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function getMacroGroup(normalizedType: string): LinkMacroGroup {
  switch (normalizedType.toLowerCase()) {
    case "gallery":
    case "showcase":
    case "component":
    case "awards":
      return "Galleries & Showcases";
    case "tool":
    case "library":
    case "directory":
    case "search":
    case "ai":
    case "security":
    case "product":
    case "platform":
    case "company":
      return "Tools & Libraries";
    case "portfolio":
    case "profile":
    case "studio":
      return "Portfolios & People";
    case "careers":
    case "job":
      return "Careers & Roles";
    default:
      return "Reading & Reference";
  }
}

function extractDomain(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return rawUrl.replace(/^https?:\/\/(www\.)?/, "");
  }
}

function enrichLinks(
  entries: readonly LinkEntry[],
): readonly NormalizedLinkEntry[] {
  return entries.map((entry) => {
    const normalizedType = normalizeTypeLabel(entry.type);
    return {
      ...entry,
      normalizedType,
      group: getMacroGroup(normalizedType),
      domain: extractDomain(entry.url),
    };
  });
}

function matchesQuery(entry: NormalizedLinkEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    entry.website.toLowerCase().includes(q) ||
    entry.description.toLowerCase().includes(q) ||
    entry.normalizedType.toLowerCase().includes(q) ||
    entry.domain.toLowerCase().includes(q) ||
    entry.group.toLowerCase().includes(q)
  );
}

function IndexChapterList({
  items,
}: {
  items: readonly NormalizedLinkEntry[];
}) {
  const containerRef = useRef<HTMLUListElement>(null);
  const hover = useFluidHover(containerRef, {
    gapClick: false,
  });

  return (
    <ul
      ref={containerRef}
      className="relative divide-y divide-border/50"
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseMove={hover.handlers.onMouseMove}
      onMouseLeave={hover.handlers.onMouseLeave}
    >
      <FluidHoverHighlight hover={hover} className="-mx-2.5 rounded-lg" />
      {items.map((entry, index) => (
        <IndexRow
          key={entry.url}
          entry={entry}
          index={index}
          registerItem={hover.registerItem}
          active={hover.activeIndex === index}
        />
      ))}
    </ul>
  );
}

function IndexRow({
  entry,
  index,
  registerItem,
  active,
}: {
  entry: NormalizedLinkEntry;
  index: number;
  registerItem: (index: number, element: HTMLElement | null) => void;
  active: boolean;
}) {
  const rowRef = useRef<HTMLLIElement>(null);
  useRegisterFluidHoverItem(registerItem, index, rowRef);

  return (
    <li
      ref={rowRef}
      className={cn(
        "relative z-10 transition-colors duration-80",
        active && "border-transparent",
      )}
    >
      <a
        href={entry.url}
        target="_blank"
        rel="noreferrer"
        data-analytics-event="Saved Link Clicked"
        data-analytics-label={entry.website}
        data-analytics-type={entry.type}
        data-analytics-location="Links Archive"
        data-sound="tap"
        className="group flex flex-col gap-1 py-3 outline-none sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
      >
        <div className="flex min-w-0 items-baseline gap-2.5">
          <Image
            src={getFaviconUrl(entry.url)}
            alt=""
            width={16}
            height={16}
            className="size-4 shrink-0 self-center rounded-[3px]"
            unoptimized
          />
          <span className="shrink-0 text-sm font-medium text-foreground underline-offset-4 group-hover:underline group-focus-visible:underline">
            {entry.website}
          </span>
          <span className="hidden truncate text-sm text-muted-foreground sm:inline">
            — {entry.description}
          </span>
        </div>

        <p className="pl-6.5 text-xs leading-5 text-muted-foreground sm:hidden">
          {entry.description}
        </p>

        <div className="flex shrink-0 items-center gap-2 pl-6.5 sm:pl-0">
          <span className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
            {entry.normalizedType}
          </span>
          <span className="font-mono text-xs text-muted-foreground transition-colors group-hover:text-foreground">
            {entry.domain}
          </span>
          <RiArrowRightUpLine
            aria-hidden="true"
            className="size-3.5 text-muted-foreground transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
          />
        </div>
      </a>
    </li>
  );
}

const FILTER_TABS: readonly (LinkMacroGroup | "All")[] = [
  "All",
  ...MACRO_GROUPS,
];

export function LinksTable({ entries }: LinksTableProps) {
  const enriched = useMemo(
    () => enrichLinks(entries),
    [
      entries,
    ],
  );
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<LinkMacroGroup | "All">(
    "All",
  );
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        const target = event.target as HTMLElement | null;
        if (
          target &&
          (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) ||
            target.isContentEditable)
        ) {
          return;
        }
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleGroupTabClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const value = event.currentTarget.dataset.group as
        | LinkMacroGroup
        | "All"
        | undefined;
      if (value) {
        setSelectedGroup(value);
      }
    },
    [],
  );

  const handleQueryChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
    },
    [],
  );

  const handleClearQuery = useCallback(() => {
    setQuery("");
    searchInputRef.current?.focus();
  }, []);

  const handleResetAll = useCallback(() => {
    setQuery("");
    setSelectedGroup("All");
  }, []);

  const filtered = useMemo(
    () =>
      enriched.filter((entry) => {
        if (selectedGroup !== "All" && entry.group !== selectedGroup) {
          return false;
        }
        return matchesQuery(entry, query);
      }),
    [
      enriched,
      selectedGroup,
      query,
    ],
  );

  const chapters = useMemo(() => {
    const groupsToShow =
      selectedGroup === "All"
        ? MACRO_GROUPS
        : [
            selectedGroup,
          ];
    return groupsToShow
      .map((group) => ({
        group,
        items: filtered.filter((item) => item.group === group),
      }))
      .filter((section) => section.items.length > 0);
  }, [
    filtered,
    selectedGroup,
  ]);

  return (
    <div className="mt-6">
      {/* Sticky Chapter & Search Rail */}
      <div className="sticky top-3 z-30 flex flex-col gap-2 rounded-xl border border-border/80 bg-background/90 p-2 backdrop-blur-md smooth-shadow-ring shadow-black smooth-ring-neutral-300/30 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0"
          role="tablist"
          aria-label="Filter directory chapters"
        >
          {FILTER_TABS.map((group) => {
            const active = selectedGroup === group;
            const label =
              group === "All"
                ? "All chapters"
                : (group.split(" & ")[0] ?? group);
            return (
              <button
                key={group}
                type="button"
                role="tab"
                aria-selected={active}
                data-group={group}
                onClick={handleGroupTabClick}
                className={cn(
                  "h-7 shrink-0 rounded-lg px-2.5 text-xs transition-colors duration-100 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-foreground text-background font-medium"
                    : "text-muted-foreground hover:bg-hover hover:text-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="relative flex items-center">
          <RiSearchLine
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground"
          />
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={handleQueryChange}
            placeholder="Find in index…"
            aria-label="Search links in editorial index"
            className="h-7 w-full rounded-lg border border-border bg-muted/40 pr-7 pl-8 text-xs text-foreground placeholder:text-muted-foreground focus-visible:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-44"
          />
          {query ? (
            <button
              type="button"
              onClick={handleClearQuery}
              aria-label="Clear search"
              className="absolute right-1.5 flex size-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            >
              <RiCloseLine className="size-3.5" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2 hidden rounded border border-border/80 bg-muted px-1 font-mono text-[10px] text-muted-foreground sm:inline-block">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Editorial Grouped Index */}
      {chapters.length === 0 ? (
        <div className="mt-10 rounded-xl border border-border/60 bg-background/80 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No entries found for{" "}
            <span className="font-medium text-foreground">“{query}”</span>.
          </p>
          <button
            type="button"
            onClick={handleResetAll}
            className="mt-2 text-xs font-medium text-foreground underline underline-offset-4"
          >
            Show all {enriched.length} links
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {chapters.map(({ group, items }) => (
            <section
              key={group}
              aria-label={group}
              className="rounded-xl bg-background/85 px-4 py-4 ring-1 ring-border/70 smooth-shadow-ring shadow-black smooth-ring-neutral-300/30 sm:px-5"
            >
              <div className="flex items-baseline justify-between border-b border-border pb-3">
                <h2 className="list-heading">{group}</h2>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {items.length} {items.length === 1 ? "entry" : "entries"}
                </span>
              </div>
              <div className="mt-1">
                <IndexChapterList items={items} />
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
