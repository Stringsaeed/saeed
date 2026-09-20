import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { ReactNode } from "react";
import { AnalyticsEvents } from "@/components/analytics-events";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader, SiteSocialLinks } from "@/components/site-header";
import { StickerField } from "@/components/sticker-field";
import { ThemeProvider } from "@/components/theme-provider";
import { getRootStructuredData } from "@/lib/structured-data";
import { InteractiveDots } from "../interactive-dots";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
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
  );
}
