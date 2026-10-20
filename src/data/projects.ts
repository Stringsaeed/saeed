import { assertHttpsUrl } from "@/lib/https-url";

export type ProjectLinkType =
  | "web"
  | "app-store"
  | "play-store"
  | "github"
  | "press"
  | "linkedin"
  | "testflight";

export type ProjectLink = {
  /** Full spoken name and tooltip; the link itself shows only an icon. */
  ariaLabel: string;
  /** Tells apart two links of the same type, like an app's iOS and Android
   *  repos. Shown beside the icon. */
  platform?: string;
  href: string;
  type: ProjectLinkType;
};

export type SideProject = {
  name: string;
  description: string;
  /** The primary destination: the live site or the App Store listing. */
  href: string;
  type: ProjectLinkType;
  logo: string;
  brand?: string;
  links: readonly ProjectLink[];
};

export type ShippedAppVariant = {
  name: string;
  appStore?: string;
  playStore?: string;
};

export type ShippedApp = {
  name: string;
  description: string;
  logo: string;
  brand: string;
  appStore: string;
  playStore: string;
  web?: string;
  /** White-label builds of the same app, kept for later use. */
  variants?: readonly ShippedAppVariant[];
};

function source(name: string, href: string, platform?: string): ProjectLink {
  return {
    platform,
    ariaLabel: `${name}${platform ? ` ${platform}` : ""} source on GitHub`,
    href: assertHttpsUrl(href),
    type: "github",
  };
}

export const sideProjects: readonly SideProject[] = [
  {
    name: "Azkarify",
    description: "Daily supplications and prayer times, in English and Arabic.",
    href: assertHttpsUrl(
      "https://apps.apple.com/us/app/azkarify-daily-azkar/id6748265935",
    ),
    type: "app-store",
    logo: "/projects/azkarify.png",
    brand: "#c85838",
    links: [
      source("Azkarify", "https://github.com/stringsaeed/azkarify-ios", "iOS"),
      source(
        "Azkarify",
        "https://github.com/stringsaeed/azkarify-android",
        "Android",
      ),
    ],
  },
  {
    name: "Trove",
    description:
      "A free, open-source money app that shows what you can spend until payday.",
    href: assertHttpsUrl("https://trove.ing"),
    type: "web",
    logo: "/projects/trove.svg",
    brand: "#d9ff43",
    links: [
      source("Trove", "https://github.com/stringsaeed/money-management"),
    ],
  },
  {
    name: "Name × Clubs",
    description:
      "A bilingual game where you name as many football clubs as you can.",
    href: assertHttpsUrl("https://clubs.saeed.sh"),
    type: "web",
    logo: "/projects/clubs.svg",
    brand: "#d2f571",
    links: [
      source("Name × Clubs", "https://github.com/stringsaeed/name-x-clubs"),
    ],
  },
  {
    name: "Jev demos",
    description: "Small demos built on TypeSafe’s Jev model.",
    href: assertHttpsUrl("https://lab.saeed.sh"),
    type: "web",
    logo: "/projects/jev.svg",
    links: [
      source("Jev demos", "https://github.com/Stringsaeed/jev-2046"),
      {
        ariaLabel: "Jev demos featured on Made with Jev",
        href: assertHttpsUrl("https://madewithjev.com/builds/jev-highlighter"),
        type: "press",
      },
    ],
  },
  {
    name: "PewPew",
    description: "A neon space shooter for iPhone, drawn entirely with WebGPU.",
    href: assertHttpsUrl("https://pewpew.saeed.sh"),
    type: "web",
    logo: "/projects/pewpew.png",
    brand: "#26e0f0",
    links: [
      // The App Store listing is not live yet; TestFlight stands in until then.
      {
        ariaLabel: "PewPew on TestFlight",
        href: assertHttpsUrl("https://testflight.apple.com/join/e8aQjBz8"),
        type: "testflight",
      },
      source("PewPew", "https://github.com/stringsaeed/pewpew"),
      {
        ariaLabel: "PewPew featured by Software Mansion on LinkedIn",
        href: assertHttpsUrl(
          "https://www.linkedin.com/posts/software-mansion_closetheloop-closetheloop-activity-7516484438797783040-0LGW",
        ),
        type: "linkedin",
      },
    ],
  },
  {
    name: "Handy",
    description:
      "A calm, hand-written to-do list with three piles and a shuffle.",
    href: assertHttpsUrl(
      "https://apps.apple.com/us/app/handy-to-do-list/id6447997533",
    ),
    type: "app-store",
    logo: "/projects/handy.png",
    brand: "#b84828",
    links: [
      source("Handy", "https://github.com/Stringsaeed/Handy-Todo"),
    ],
  },
];

function shippedApp(app: ShippedApp): ShippedApp {
  return {
    ...app,
    appStore: assertHttpsUrl(app.appStore),
    playStore: assertHttpsUrl(app.playStore),
    web: app.web === undefined ? undefined : assertHttpsUrl(app.web),
    variants: app.variants?.map((variant) => ({
      name: variant.name,
      appStore:
        variant.appStore === undefined
          ? undefined
          : assertHttpsUrl(variant.appStore),
      playStore:
        variant.playStore === undefined
          ? undefined
          : assertHttpsUrl(variant.playStore),
    })),
  };
}

export const shippedApps: readonly ShippedApp[] = [
  shippedApp({
    name: "Thndr",
    description: "Investing in stocks, funds, and gold for Egypt and the Gulf.",
    logo: "/projects/thndr.png",
    brand: "#ffff00",
    appStore:
      "https://apps.apple.com/us/app/thndr-invest-your-money/id1494883259",
    playStore:
      "https://play.google.com/store/apps/details?id=com.axismarkets.thndr",
    web: "https://x.thndr.app/",
  }),
  shippedApp({
    name: "dubizzle cars",
    description: "Dealer app for managing car listings in the UAE.",
    logo: "/projects/dubizzle-cars.png",
    brand: "#ed0000",
    appStore: "https://apps.apple.com/us/app/dubizzle-cars/id1530787568",
    playStore:
      "https://play.google.com/store/apps/details?id=com.dubizzle.dealerapp",
  }),
  shippedApp({
    name: "Nomo",
    description: "Digital Sharia banking for Kuwait, the UAE, and the GCC.",
    logo: "/projects/nomo.png",
    brand: "#bde8c6",
    appStore:
      "https://apps.apple.com/us/app/nomo-digital-sharia-banking/id1550582839",
    playStore:
      "https://play.google.com/store/apps/details?id=com.nomo.bank.app",
    variants: [
      {
        name: "ADCB Nomo",
        appStore: "https://apps.apple.com/us/app/adcb-nomo-uae/id1670731293",
        playStore:
          "https://play.google.com/store/apps/details?id=com.adcb.bank.app",
      },
      {
        name: "Al Hilal Nomo",
        appStore:
          "https://apps.apple.com/us/app/al-hilal-nomo-uae/id1672005671",
        playStore:
          "https://play.google.com/store/apps/details?id=com.alhilal.bank.app",
      },
    ],
  }),
  shippedApp({
    name: "Breadfast",
    description: "Groceries and daily essentials delivered in minutes, Egypt.",
    logo: "/projects/breadfast.png",
    brand: "#b6008b",
    appStore:
      "https://apps.apple.com/us/app/breadfast-groceries-and-more/id1288436997",
    playStore: "https://play.google.com/store/apps/details?id=com.breadfast",
  }),
  shippedApp({
    name: "du",
    description: "Account, recharge, and plan management for the UAE telecom.",
    logo: "/projects/du.png",
    brand: "#00a9ce",
    appStore: "https://apps.apple.com/us/app/du/id521545878",
    playStore:
      "https://play.google.com/store/apps/details?id=duleaf.duapp.splash",
  }),
  shippedApp({
    name: "Growth",
    description: "Ordering and loyalty for coffee shops, Saudi Arabia.",
    logo: "/projects/growth.png",
    brand: "#6a4cff",
    appStore:
      "https://apps.apple.com/us/app/growth-%D9%82%D8%B1%D9%88%D8%AB/id6446317654",
    playStore:
      "https://play.google.com/store/apps/details?id=com.sa_growth.growth",
  }),
  shippedApp({
    name: "Bird Nest",
    description: "Booking homes in Marassi, New Cairo, and Zayed.",
    logo: "/projects/birdnest.png",
    brand: "#2b2b2b",
    appStore: "https://apps.apple.com/us/app/bird-nest-life/id1604064900",
    playStore:
      "https://play.google.com/store/apps/details?id=com.birdnestlife.customerapp",
  }),
  shippedApp({
    name: "Bynh",
    description: "Legal consultations with licensed lawyers, Saudi Arabia.",
    logo: "/projects/bynh.png",
    brand: "#134a63",
    appStore:
      "https://apps.apple.com/us/app/%D8%A8%D9%8A%D9%86%D9%87-%D8%A7%D8%B3%D8%AA%D8%B4%D8%A7%D8%B1%D8%A7%D8%AA-%D9%88%D8%AE%D8%AF%D9%85%D8%A7%D8%AA-%D9%82%D8%A7%D9%86%D9%88%D9%86%D9%8A%D8%A9/id1508259137",
    playStore: "https://play.google.com/store/apps/details?id=com.baeynh",
  }),
];
