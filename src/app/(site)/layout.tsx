import type { ReactNode } from "react";
import { AnalyticsEvents } from "@/components/analytics-events";
import { DeferredAnalytics } from "@/components/deferred-analytics";
import { JsonLd } from "@/components/json-ld";
import { SiteBackdrop } from "@/components/site-backdrop";
import { SiteHeader, SiteSocialLinks } from "@/components/site-header";
import { SiteSounds } from "@/components/site-sounds";
import { ThemeProvider } from "@/components/theme-provider";
import { getRootStructuredData } from "@/lib/structured-data";

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
        <SiteBackdrop />
        <div className="site-layout relative z-10 mx-auto flex min-h-dvh w-full max-w-176 flex-col px-6 sm:px-8">
          <SiteHeader />
          {children}
          <SiteSocialLinks />
        </div>
      </div>
      <DeferredAnalytics />
      <AnalyticsEvents />
      <SiteSounds />
    </ThemeProvider>
  );
}
