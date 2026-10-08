import type { Metadata } from "next";
import localFont from "next/font/local";
import { getSiteOrigin, siteDescription, siteName } from "@/lib/site";
import "./globals.css";

// Each Latin family is split in two faces of the same font. The core face
// covers ASCII plus the punctuation the site sets, and is the only one that is
// preloaded; the original file stays behind it for every other Latin
// character, so browsers only fetch it on a page that needs one. The
// metric-matched fallbacks live in globals.css, after both faces. next/font
// needs literal options, so the two ranges repeat.
const geistSans = localFont({
  src: "../fonts/geist-core.woff2",
  weight: "100 900",
  variable: "--font-geist-sans-core",
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0020-007E, U+00A0, U+00A9, U+00AE, U+00B7, U+2013-2014, U+2018-2019, U+201C-201D, U+2022, U+2026",
    },
  ],
});

const geistSansExtended = localFont({
  src: "../fonts/geist-latin.woff2",
  weight: "100 900",
  variable: "--font-geist-sans-extended",
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

const geistMono = localFont({
  src: "../fonts/geist-mono-core.woff2",
  weight: "100 900",
  variable: "--font-geist-mono-core",
  adjustFontFallback: false,
  // Only small dates and labels use it; swapping in late beats competing
  // with the first paint for bandwidth.
  preload: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0020-007E, U+00A0, U+00A9, U+00AE, U+00B7, U+2013-2014, U+2018-2019, U+201C-201D, U+2022, U+2026",
    },
  ],
});

const geistMonoExtended = localFont({
  src: "../fonts/geist-mono-latin.woff2",
  weight: "100 900",
  variable: "--font-geist-mono-extended",
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

// unicode-range so Arabic glyphs use this face even when Geist's fallback
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
      className={`${geistSans.variable} ${geistSansExtended.variable} ${geistMono.variable} ${geistMonoExtended.variable} ${ibmPlexSansArabic.variable} ${lavishlyYours.variable} ${lavishlyYoursExtended.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
