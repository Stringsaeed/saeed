import {
  type ProjectLink,
  type ProjectLinkType,
  type ShippedApp,
  type SideProject,
  shippedApps,
  sideProjects,
} from "@/data/projects";

// Everything that can sit on the phone's home screen.
//
// Built-in apps are the sections of the site (Work, Writing, Things, …) and
// open a route inside the phone. Project apps are the real apps: the ones
// shipped at work and the side projects, each with its own detail screen.

export type BuiltInAppId =
  | "work"
  | "projects"
  | "writing"
  | "things"
  | "library"
  | "links"
  | "me"
  | "settings";

export type BuiltInApp = {
  kind: "builtin";
  id: BuiltInAppId;
  name: string;
  href: `/${string}`;
  /** One line under the title in list views. */
  blurb: string;
  /** Two-stop gradient behind the glyph. */
  gradient: readonly [string, string];
};

export type ProjectApp = {
  kind: "project";
  id: string;
  name: string;
  href: `/projects/${string}`;
  description: string;
  logo: string;
  brand?: string;
  group: "shipped" | "side";
  /** What I did on it, when it is not my own. */
  role?: string;
  /** Primary destination, then everything else. */
  primary: ProjectLink;
  links: readonly ProjectLink[];
};

export type App = BuiltInApp | ProjectApp;

export const builtInApps: readonly BuiltInApp[] = [
  {
    kind: "builtin",
    id: "work",
    name: "Work",
    href: "/work",
    blurb: "Seven years, seven companies.",
    gradient: [
      "#4f6bff",
      "#2a3fd6",
    ],
  },
  {
    kind: "builtin",
    id: "projects",
    name: "Apps",
    href: "/projects",
    blurb: "Sixteen apps on two stores.",
    gradient: [
      "#7a5cff",
      "#4b2fd6",
    ],
  },
  {
    kind: "builtin",
    id: "writing",
    name: "Writing",
    href: "/blog",
    blurb: "Notes on React Native and agents.",
    gradient: [
      "#ff9a3c",
      "#e5531f",
    ],
  },
  {
    kind: "builtin",
    id: "things",
    name: "Things",
    href: "/things",
    blurb: "Eight objects, eight stories.",
    gradient: [
      "#fff2d1",
      "#f3d9a4",
    ],
  },
  {
    kind: "builtin",
    id: "library",
    name: "Library",
    href: "/library",
    blurb: "Six books I keep coming back to.",
    gradient: [
      "#b97f5a",
      "#7b4a2d",
    ],
  },
  {
    kind: "builtin",
    id: "links",
    name: "Links",
    href: "/links",
    blurb: "Saved tools, articles, and sites.",
    gradient: [
      "#34c77b",
      "#1a8f57",
    ],
  },
  {
    kind: "builtin",
    id: "me",
    name: "Me",
    href: "/me",
    blurb: "Who I am and how to reach me.",
    gradient: [
      "#f6cb18",
      "#e0a80a",
    ],
  },
  {
    kind: "builtin",
    id: "settings",
    name: "Settings",
    href: "/settings",
    blurb: "Platform, appearance, sound.",
    gradient: [
      "#9a9aa3",
      "#5f5f68",
    ],
  },
];

const shippedRoles: Record<string, string> = {
  Thndr:
    "Shipped the ADX order flow end to end (limit, market, advanced limit, recurring) and moved the Egypt, US, and ADX markets onto one configuration model.",
  "dubizzle cars":
    "Part of the dubizzle mobile team: draft listings, the listing UI, agent billing, and crash screens across iOS, Android, and web.",
  Nomo: "Moved the banking UI onto a custom design system with Storybook, built the Open Banking flows, and hardened iOS and Android CI/CD.",
  Breadfast:
    "First mobile engineer after COVID: cleared 20+ critical crashes, led shopping and growth, and introduced TypeScript and a new design system.",
  Growth:
    "Freelance, 2022 to 2024: a beta business-growth app in React Native and TypeScript for coffee shops in Saudi Arabia.",
  "Bird Nest": "Published on iOS and Android as a freelance build.",
  Bynh: "Freelance, 2023: voice, video calls, and realtime with Pusher.",
};

export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function shippedToApp(app: ShippedApp): ProjectApp {
  const slug = slugify(app.name);
  const links: ProjectLink[] = [
    {
      ariaLabel: `${app.name} on Google Play`,
      href: app.playStore,
      type: "play-store",
    },
  ];
  if (app.web) {
    links.push({
      ariaLabel: `${app.name} on the web`,
      href: app.web,
      type: "web",
    });
  }
  for (const variant of app.variants ?? []) {
    if (variant.appStore) {
      links.push({
        ariaLabel: `${variant.name} on the App Store`,
        platform: variant.name,
        href: variant.appStore,
        type: "app-store",
      });
    }
    if (variant.playStore) {
      links.push({
        ariaLabel: `${variant.name} on Google Play`,
        platform: variant.name,
        href: variant.playStore,
        type: "play-store",
      });
    }
  }
  return {
    kind: "project",
    id: slug,
    name: app.name,
    href: `/projects/${slug}`,
    description: app.description,
    logo: app.logo,
    brand: app.brand,
    group: "shipped",
    role: shippedRoles[app.name],
    primary: {
      ariaLabel: `${app.name} on the App Store`,
      href: app.appStore,
      type: "app-store",
    },
    links,
  };
}

function sideToApp(project: SideProject): ProjectApp {
  const slug = slugify(project.name);
  return {
    kind: "project",
    id: slug,
    name: project.name,
    href: `/projects/${slug}`,
    description: project.description,
    logo: project.logo,
    brand: project.brand,
    group: "side",
    primary: {
      ariaLabel:
        project.type === "app-store"
          ? `${project.name} on the App Store`
          : `${project.name}, ${new URL(project.href).hostname}`,
      href: project.href,
      type: project.type,
    },
    links: project.links,
  };
}

export const shippedProjectApps: readonly ProjectApp[] =
  shippedApps.map(shippedToApp);
export const sideProjectApps: readonly ProjectApp[] =
  sideProjects.map(sideToApp);
export const projectApps: readonly ProjectApp[] = [
  ...shippedProjectApps,
  ...sideProjectApps,
];

export function findProjectApp(slug: string) {
  return projectApps.find((app) => app.id === slug) ?? null;
}

export function findBuiltInApp(id: BuiltInAppId) {
  const app = builtInApps.find((candidate) => candidate.id === id);
  if (!app) throw new Error(`Unknown app ${id}`);
  return app;
}

export const linkTypeLabels: Record<ProjectLinkType, string> = {
  "app-store": "App Store",
  "play-store": "Google Play",
  github: "GitHub",
  web: "Website",
  press: "Press",
  linkedin: "LinkedIn",
  testflight: "TestFlight",
};

/** The dock holds the four apps a visitor is most likely to want. */
export const dockAppIds: readonly BuiltInAppId[] = [
  "work",
  "projects",
  "writing",
  "me",
];
