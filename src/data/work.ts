// Roles, newest first. Bullets come from the CV; the home page only needs
// the first line of each, the Work app shows them all.
export type Role = {
  company: string;
  title: string;
  period: string;
  start: string;
  end: string | null;
  location: string;
  href: string;
  logo?: string;
  brand: string;
  stack: string;
  summary: string;
  bullets: readonly string[];
};

export const roles: readonly Role[] = [
  {
    company: "Aquanow",
    title: "Senior Software Engineer",
    period: "Apr 2026 to Sep 2026",
    start: "2026-04",
    end: "2026-09",
    location: "Dubai, UAE",
    href: "https://aquanow.io/",
    logo: "/work/aquanow.png",
    brand: "#3FA2F0",
    stack: "React Native, TypeScript",
    summary: "Digital-asset infrastructure and liquidity.",
    bullets: [
      "Built frontend and mobile for a regulated digital-asset infrastructure and liquidity platform.",
      "Shipped across web and mobile on customer-facing and internal surfaces.",
    ],
  },
  {
    company: "Thndr",
    title: "Senior Frontend Engineer",
    period: "Apr 2025 to Mar 2026",
    start: "2025-04",
    end: "2026-03",
    location: "Remote, Dubai",
    href: "https://thndr.app/",
    logo: "/work/thndr.png",
    brand: "#ffff00",
    stack: "React, React Native, TypeScript, NX",
    summary: "Investing for Egypt, the US, and Abu Dhabi.",
    bullets: [
      "Shipped the ADX order flow end to end: limit, market, advanced limit, and recurring orders.",
      "Moved the Egypt, US, and ADX markets onto one config model, cutting conditional complexity across the app.",
      "Set squad-level technical initiatives and onboarded engineers into critical trading workflows.",
    ],
  },
  {
    company: "Dubizzle",
    title: "Senior React Native Engineer",
    period: "Apr 2024 to Feb 2025",
    start: "2024-04",
    end: "2025-02",
    location: "Dubai, UAE",
    href: "https://www.dubizzle.com/",
    logo: "/work/dubizzle.png",
    brand: "#ed0000",
    stack: "React Native, Expo, React Native Web",
    summary: "Classifieds across iOS, Android, and web.",
    bullets: [
      "Added native and JS error boundaries with custom crash screens across iOS, Android, and web.",
      "Shipped draft listings, the listing UI, and an agent billing flow; upgraded Android to SDK 34 for Play compliance.",
      "Shipped a ratings prompt aimed at App Store and Play ratings.",
    ],
  },
  {
    company: "Nomo",
    title: "Senior Software Engineer",
    period: "Feb 2023 to May 2024",
    start: "2023-02",
    end: "2024-05",
    location: "Remote, UK",
    href: "https://nomobank.com/",
    logo: "/work/nomo.png",
    brand: "#bde8c6",
    stack: "React, React Native, TypeScript",
    summary: "Digital Sharia banking for Kuwait, the UAE, and the GCC.",
    bullets: [
      "Moved 12+ complex components from UI Kitten onto a custom design system with Storybook.",
      "Implemented Open Banking AIS, PIS, and Confirmation of Funds flows.",
      "Hardened iOS and Android CI/CD for builds and deploys.",
    ],
  },
  {
    company: "Breadfast",
    title: "Senior Software Engineer",
    period: "Feb 2022 to Mar 2023",
    start: "2022-02",
    end: "2023-03",
    location: "Cairo, Egypt",
    href: "https://www.breadfast.com/",
    logo: "/work/breadfast.png",
    brand: "#b6008b",
    stack: "React Native, TypeScript",
    summary: "Groceries in minutes, past one million active users.",
    bullets: [
      "Joined as the first mobile engineer after COVID; cleared 20+ critical crashes and restabilised the app.",
      "Led shopping and growth work, introduced TypeScript, and shipped a new design system with product, backend, and QA.",
      "Mentored juniors and tightened CI/CD, release management, and onboarding.",
    ],
  },
  {
    company: "Anspire Agency",
    title: "Senior Software Developer",
    period: "May 2020 to Jun 2022",
    start: "2020-05",
    end: "2022-06",
    location: "Cairo, Egypt",
    href: "https://anspire.agency/",
    brand: "#5b6cff",
    stack: "React, React Native, Node.js, MongoDB",
    summary: "Client apps and dashboards for an agency.",
    bullets: [
      "Built client mobile apps and admin dashboards; owned staging, production, and deploy automation.",
    ],
  },
  {
    company: "ExpandCart",
    title: "React Native Developer",
    period: "Oct 2019 to Oct 2020",
    start: "2019-10",
    end: "2020-10",
    location: "Giza, Egypt",
    href: "https://expandcart.com/",
    brand: "#ff7a00",
    stack: "React Native, Fastlane, AppCenter",
    summary: "White-label shop apps at volume.",
    bullets: [
      "Shipped 3+ custom mobile themes and deployed 300+ apps through Fastlane and AppCenter.",
    ],
  },
];

export const currentRole = roles[0];
