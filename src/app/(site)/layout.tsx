import type { ReactNode } from "react";
import { AnalyticsEvents } from "@/components/analytics-events";
import { DeferredAnalytics } from "@/components/deferred-analytics";
import { JsonLd } from "@/components/json-ld";
import { LayoutDebug } from "@/components/layout-debug";
import { SiteHeader, SiteSocialLinks } from "@/components/site-header";
import { SiteSounds } from "@/components/site-sounds";
import { StickerPile } from "@/components/sticker-pile";
import { ThemeProvider } from "@/components/theme-provider";
import { getRootStructuredData } from "@/lib/structured-data";

export default function SiteLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <JsonLd data={getRootStructuredData()} />
      <div className="relative isolate min-h-screen overflow-x-clip">
        <div className="site-layout relative z-10 mx-auto flex min-h-dvh w-full max-w-176 flex-col px-6 sm:px-8">
          <SiteHeader />
          {children}
          <SiteSocialLinks />
        </div>
        <StickerPile />
      </div>
      {modal}
      <LayoutDebug />
      <DeferredAnalytics />
      <AnalyticsEvents />
      <SiteSounds />
    </ThemeProvider>
  );
}
