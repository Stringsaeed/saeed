import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Lavishly_Yours } from "next/font/google";
import localFont from "next/font/local";
import { AnalyticsEvents } from "@/components/analytics-events";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader, SiteSocialLinks } from "@/components/site-header";
import { StickerField } from "@/components/sticker-field";
import { ThemeProvider } from "@/components/theme-provider";
import { getSiteOrigin, siteDescription, siteName } from "@/lib/site";
import { getRootStructuredData } from "@/lib/structured-data";
import { InteractiveDots } from "./interactive-dots";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: [
    "latin",
  ],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: [
    "latin",
  ],
});

// unicode-range so Arabic glyphs use this face even when Geist's fallback
// would otherwise claim them (https://stackoverflow.com/a/6487102).
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
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC",
    },
  ],
});

const lavishlyYours = Lavishly_Yours({
  variable: "--font-lavishly-yours",
  weight: "400",
  subsets: [
    "latin",
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
    "Boston",
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
      className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexSansArabic.variable} ${lavishlyYours.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <JsonLd data={getRootStructuredData()} />
          <div className="relative isolate min-h-screen overflow-x-hidden">
            <InteractiveDots />
            <StickerField />
            <div
              className="site-layout relative z-10 mx-auto flex min-h-dvh w-full max-w-176 flex-col px-6 sm:px-8"
              data-sticker-protected
            >
              <SiteHeader />
              {children}
              <SiteSocialLinks />
            </div>
          </div>
          <Analytics />
          <SpeedInsights />
          <AnalyticsEvents />
        </ThemeProvider>
      </body>
    </html>
  );
}
