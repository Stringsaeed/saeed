import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import localFont from "next/font/local";
import { getSiteOrigin, siteDescription, siteName } from "@/lib/site";
import "./globals.css";

// Atkinson Hyperlegible Next (Braille Institute), the variable roman.
// next/font/google self-hosts it and preloads only the latin subset; latin-ext
// stays behind its unicode-range until a page needs it. Google has no fallback
// metrics for it yet, so the Arial-based fallback lives in globals.css.
const atkinson = Atkinson_Hyperlegible_Next({
  subsets: [
    "latin",
  ],
  variable: "--font-atkinson",
  adjustFontFallback: false,
  fallback: [
    "Atkinson Hyperlegible Next Fallback",
  ],
});

// Paper Mono (paper.design/mono, SIL OFL 1.1), one variable file. Only small
// dates and labels use it; swapping in late beats competing with the first
// paint for bandwidth.
const paperMono = localFont({
  src: "../fonts/paper-mono.woff2",
  weight: "100 800",
  variable: "--font-paper-mono",
  preload: false,
});

// unicode-range so Arabic glyphs use this face even when Atkinson's fallback
// would otherwise claim them (https://stackoverflow.com/a/6487102). Not
// preloaded: the range means browsers only fetch a weight when a page
// actually renders Arabic text.
const ibmPlexSansArabic = localFont({
  src: [
    {
      path: "../fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-arabic",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC",
    },
  ],
});

// Lavishly Yours is split in two faces of the same font. The core face covers
// ASCII plus the punctuation the site sets, and is the only one that is
// preloaded; the original file stays behind it for every other Latin
// character, so browsers only fetch it on a page that needs one. The
// metric-matched fallback lives in globals.css, after both faces. next/font
// needs literal options, so the two ranges repeat.
const lavishlyYours = localFont({
  src: "../fonts/lavishly-yours-core.woff2",
  weight: "400",
  variable: "--font-lavishly-yours-core",
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0020-007E, U+00A0, U+00A9, U+00AE, U+00B7, U+2013-2014, U+2018-2019, U+201C-201D, U+2022, U+2026",
    },
  ],
});

const lavishlyYoursExtended = localFont({
  src: "../fonts/lavishly-yours-latin.woff2",
  weight: "400",
  variable: "--font-lavishly-yours-extended",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-001F, U+007F-009F, U+00A1-00A8, U+00AA-00AD, U+00AF-00B6, U+00B8-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-2012, U+2015-2017, U+201A-201B, U+201E-2021, U+2023-2025, U+2027-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a layout.
export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  authors: [
    {
      name: siteName,
      url: "/",
    },
  ],
  creator: siteName,
  publisher: siteName,
  keywords: [
    "Saeed",
    "software engineer",
    "React Native",
    "TypeScript",
    "mobile development",
  ],
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: siteName,
    description: siteDescription,
    siteName,
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    creator: "@stringsaeed",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${atkinson.variable} ${ibmPlexSansArabic.variable} ${lavishlyYours.variable} ${lavishlyYoursExtended.variable} ${paperMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
