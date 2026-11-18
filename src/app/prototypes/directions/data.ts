import { CARTRIDGES } from "@/components/cartridges/cartridges";
import { CLAUSES } from "@/components/things-copy";
import { BOOKS } from "@/data/books";
import { WORK } from "@/data/work";

// Everything the site says today, flattened for the direction prototypes.
// Each variant reads from here, so they all show the same real content and
// only the idea differs.

export type Post = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: readonly string[];
};

export type SavedLink = {
  website: string;
  type: string;
  url: string;
};

/** What the server page reads and hands to every variant. */
export type SiteData = {
  posts: readonly Post[];
  linkCount: number;
  linkSample: readonly SavedLink[];
  /** The whole archive, for a variant that lists it in place. */
  links: readonly SavedLink[];
};

export const INTRO = "I’m Saeed, a software engineer.";

export const FOCUS = [
  "React Native",
  "TypeScript",
  "performance",
  "accessibility",
  "native code",
  "agent-assisted engineering",
] as const;

export const FOCUS_SENTENCE = `I work on ${FOCUS.slice(0, -1).join(", ")}, and ${FOCUS.at(-1)}.`;

export { WORK };

const LINK_LABEL: Record<string, string> = {
  "app-store": "App Store",
  "play-store": "Google Play",
  web: "Web",
  github: "Source",
  press: "Press",
  linkedin: "LinkedIn",
  testflight: "TestFlight",
};

export type App = {
  id: string;
  name: string;
  description: string;
  logo: string;
  brand: string;
  kind: "shipped" | "side";
  href: string;
  links: readonly {
    label: string;
    href: string;
  }[];
};

export const APPS: readonly App[] = CARTRIDGES.map((cartridge) => ({
  id: cartridge.id,
  name: cartridge.name,
  description: cartridge.description,
  logo: cartridge.logo,
  brand: cartridge.brand,
  kind: cartridge.kind,
  href: cartridge.links[0]?.href ?? "#",
  links: cartridge.links.map((link) => ({
    label: link.platform
      ? `${LINK_LABEL[link.type]} (${link.platform})`
      : LINK_LABEL[link.type],
    href: link.href,
  })),
}));

export const SHIPPED = APPS.filter((app) => app.kind === "shipped");
export const SIDE = APPS.filter((app) => app.kind === "side");

export const LIBRARY = BOOKS.map((book) => ({
  id: book.id,
  title: book.title,
  author: book.author,
  cover: book.cover,
  color: book.coverColor,
}));

// The "Things" sentence, one clause per row: what he does, and with what.
export const THINGS = CLAUSES.map((clause) => ({
  id: clause.id,
  lead: clause.lead.replace(/^and /, ""),
  rest: clause.rest
    .map((token) => (typeof token === "string" ? token : token.word))
    .join("")
    .trim()
    .replace(/[.,]$/, ""),
}));

export const THINGS_SENTENCE = CLAUSES.map(
  (clause) =>
    clause.lead +
    clause.rest
      .map((token) => (typeof token === "string" ? token : token.word))
      .join(""),
).join(" ");

export const CATS = [
  {
    name: "Bosha",
    coat: "tuxedo",
  },
  {
    name: "Sono",
    coat: "orange and white",
  },
] as const;

export const CONTACT = [
  {
    label: "Email",
    short: "EMAIL",
    href: "mailto:stringsaeed@gmail.com",
    value: "stringsaeed@gmail.com",
  },
  {
    label: "GitHub",
    short: "GITHUB",
    href: "https://github.com/stringsaeed",
    value: "github.com/stringsaeed",
  },
  {
    label: "LinkedIn",
    short: "LINKEDIN",
    href: "https://linkedin.com/in/stringsaeed",
    value: "linkedin.com/in/stringsaeed",
  },
  {
    label: "X",
    short: "X",
    href: "https://x.com/stringsaeed",
    value: "x.com/stringsaeed",
  },
  {
    label: "Bluesky",
    short: "BSKY",
    href: "https://bsky.app/profile/saeed.guru",
    value: "saeed.guru",
  },
  {
    label: "Letterboxd",
    short: "LBOXD",
    href: "https://letterboxd.com/stringsaeed/",
    value: "letterboxd.com/stringsaeed",
  },
] as const;

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function shortDate(date: string) {
  return dateFormat.format(new Date(date));
}

export function isExternal(href: string) {
  return /^(https?:|mailto:)/.test(href);
}

/** Props for a link that leaves the site; none for one that stays. */
export function linkProps(href: string) {
  return href.startsWith("http")
    ? {
        target: "_blank",
        rel: "noreferrer",
      }
    : {};
}
