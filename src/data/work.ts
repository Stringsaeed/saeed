// Where I have worked, newest first. The home page names them in a sentence
// and says what I did at each when one is pointed at.
export type WorkItem = {
  company: string;
  period: string;
  href: string;
  logo: string;
  brand: string;
  description: string;
};

export const WORK: WorkItem[] = [
  {
    company: "Aquanow",
    period: "Apr 2026 to Sep 2026",
    href: "https://aquanow.io/",
    logo: "/work/aquanow.png",
    brand: "#3FA2F0",
    description:
      "React Native and TypeScript on digital-asset infrastructure and liquidity.",
  },
  {
    company: "Thndr",
    period: "2025 to 2026",
    href: "https://thndr.app/",
    logo: "/work/thndr.png",
    brand: "#ffff00",
    description:
      "ADX order flows and shared market configuration for Egypt, US equities, and Abu Dhabi.",
  },
  {
    company: "Dubizzle",
    period: "2024 to 2025",
    href: "https://www.dubizzle.com/",
    logo: "/work/dubizzle.png",
    brand: "#ed0000",
    description:
      "Listings, stability, ratings, SDK upgrades, and billing across mobile and web.",
  },
  {
    company: "Nomo",
    period: "2023 to 2024",
    href: "https://nomobank.com/",
    logo: "/work/nomo.png",
    brand: "#bde8c6",
    description:
      "Digital banking for customers across Kuwait, the UAE, and the GCC.",
  },
  {
    company: "Breadfast",
    period: "2022 to 2023",
    href: "https://www.breadfast.com/",
    logo: "/work/breadfast.png",
    brand: "#b6008b",
    description:
      "Mobile reliability while the grocery product grew beyond one million active users.",
  },
];
