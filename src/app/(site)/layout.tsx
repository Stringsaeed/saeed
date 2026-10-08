import type { ReactNode } from "react";
import { AnalyticsEvents } from "@/components/analytics-events";
import { DeferredAnalytics } from "@/components/deferred-analytics";
import { DesktopStickerField } from "@/components/desktop-sticker-field";
import { JsonLd } from "@/components/json-ld";
import { LayoutDebug } from "@/components/layout-debug";
import { SiteHeader, SiteSocialLinks } from "@/components/site-header";
import { SiteSounds } from "@/components/site-sounds";
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
      <div className="relative isolate min-h-screen overflow-x-clip">
        <InteractiveDots />
        <DesktopStickerField />
        <div
          className="site-layout relative z-10 mx-auto flex min-h-dvh w-full max-w-176 flex-col px-6 sm:px-8"
          data-sticker-protected
        >
          <SiteHeader />
          {children}
          <SiteSocialLinks />
        </div>
      </div>
      <LayoutDebug />
      <DeferredAnalytics />
      <AnalyticsEvents />
      <SiteSounds />
    </ThemeProvider>
  );
}
