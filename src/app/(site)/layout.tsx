import type { ReactNode } from "react";
import { AgentTools } from "@/components/agent-tools";
import { AnalyticsEvents } from "@/components/analytics-events";
import {
  BlueprintSheetBackdrop,
  BlueprintTitleBlock,
} from "@/components/blueprint-chrome";
import { DeferredAnalytics } from "@/components/deferred-analytics";
import { DeferredBackdrop } from "@/components/deferred-backdrop";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader, SiteSocialLinks } from "@/components/site-header";
import { SiteSounds } from "@/components/site-sounds";
import { ThemeProvider } from "@/components/theme-provider";
import { BLUEPRINT_BOOTSTRAP_SCRIPT } from "@/lib/blueprint-script";
import { getRootStructuredData } from "@/lib/structured-data";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static inline bootstrap script to restore data-blueprint before first paint.
        dangerouslySetInnerHTML={{
          __html: BLUEPRINT_BOOTSTRAP_SCRIPT,
        }}
      />
      <JsonLd data={getRootStructuredData()} />
      <div className="relative isolate min-h-screen overflow-x-clip">
        <DeferredBackdrop />
        <BlueprintSheetBackdrop />
        <div className="site-layout relative z-10 mx-auto flex min-h-dvh w-full max-w-176 flex-col px-6 sm:px-8">
          <SiteHeader />
          {children}
          <BlueprintTitleBlock />
          <SiteSocialLinks />
        </div>
      </div>
      <DeferredAnalytics />
      <AnalyticsEvents />
      <SiteSounds />
      <AgentTools />
    </ThemeProvider>
  );
}
