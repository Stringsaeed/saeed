import { CARTRIDGES } from "@/components/cartridges/cartridges";
import { CLAUSES } from "@/components/things-copy";
import { BOOKS } from "@/data/books";
import { CONTACT } from "@/data/contact";
import { WORK } from "@/data/work";

// Everything the site says, flattened for the terminal: the git client's
// panes and the shell's files are both built from this.

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

/** What the server layout reads and hands to the terminal. */
export type SiteData = {
  posts: readonly Post[];
  links: readonly SavedLink[];
};

export const INTRO = "I’m Saeed, a software engineer.";

const FOCUS = [
  "React Native",
  "TypeScript",
  "performance",
  "accessibility",
  "native code",
  "agent-assisted engineering",
] as const;

export const FOCUS_SENTENCE = `I work on ${FOCUS.slice(0, -1).join(", ")}, and ${FOCUS.at(-1)}.`;

export { CONTACT, WORK };

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
  kind: "shipped" | "side";
  links: readonly {
    label: string;
    href: string;
  }[];
};

const APPS: readonly App[] = CARTRIDGES.map((cartridge) => ({
  id: cartridge.id,
  name: cartridge.name,
  description: cartridge.description,
  kind: cartridge.kind,
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
}));

// The "Things" sentence, read straight through.
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

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Written out by hand, not with Intl: the server and a browser can abbreviate
// a month differently ("Sept" and "Sep"), and the page must read the same on
// both or it fails to hydrate.
export function shortDate(date: string) {
  const day = new Date(date);
  return `${String(day.getUTCDate()).padStart(2, "0")} ${MONTHS[day.getUTCMonth()]} ${day.getUTCFullYear()}`;
}

/** Whether a link leaves the site (or the browser, for mail and phone). */
export function leavesSite(href: string) {
  return /^(https?:|mailto:|tel:)/.test(href) || href.endsWith(".pdf");
}

/** Props for a link that opens elsewhere; none for one that stays. */
export function linkProps(href: string) {
  return href.startsWith("http")
    ? {
        target: "_blank",
        rel: "noreferrer",
      }
    : {};
}
