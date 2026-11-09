import type { ReactNode } from "react";
import { AnalyticsEvents } from "@/components/analytics-events";
import { DeferredAnalytics } from "@/components/deferred-analytics";
import { JsonLd } from "@/components/json-ld";
import { DeviceShell } from "@/components/os/device-shell";
import { PlatformProvider } from "@/components/os/platform";
import { SiteSounds } from "@/components/site-sounds";
import { ThemeProvider } from "@/components/theme-provider";
import { getPosts } from "@/lib/content";
import { getRootStructuredData } from "@/lib/structured-data";

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  // The lock screen shows the latest posts as notifications.
  const posts = await getPosts();
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <JsonLd data={getRootStructuredData()} />
      <PlatformProvider>
        <DeviceShell posts={posts.slice(0, 2)}>{children}</DeviceShell>
      </PlatformProvider>
      <DeferredAnalytics />
      <AnalyticsEvents />
      <SiteSounds />
    </ThemeProvider>
  );
}
