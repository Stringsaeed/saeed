import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Lavishly_Yours } from "next/font/google";
import { AnalyticsEvents } from "@/components/analytics-events";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader, SiteSocialLinks } from "@/components/site-header";
import { StickerField } from "@/components/sticker-field";
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
    "Dubai",
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
      className={`${geistSans.variable} ${geistMono.variable} ${lavishlyYours.variable} h-full antialiased`}
    >
      <body className="min-h-full">
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
      </body>
    </html>
  );
}
