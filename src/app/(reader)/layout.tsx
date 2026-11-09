import { RiArrowLeftSLine } from "@remixicon/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AnalyticsEvents } from "@/components/analytics-events";
import { DeferredAnalytics } from "@/components/deferred-analytics";
import { JsonLd } from "@/components/json-ld";
import { PlatformProvider } from "@/components/os/platform";
import { SiteBackdrop } from "@/components/site-backdrop";
import { SiteSocialLinks } from "@/components/site-header";
import { SiteSounds } from "@/components/site-sounds";
import { SoundToggle } from "@/components/sound-toggle";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeSwitcher } from "@/components/theme-switcher-trigger";
import { getRootStructuredData } from "@/lib/structured-data";

// Posts are read outside the phone. A 393px column is fine for a list, not
// for an essay, so the reader takes the whole window and offers a way back
// into the Writing app.
export default function ReaderLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <JsonLd data={getRootStructuredData()} />
      <PlatformProvider>
        <div className="relative isolate min-h-screen overflow-x-clip">
          <SiteBackdrop />
          <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-176 flex-col px-6 sm:px-8">
            <header className="flex items-center justify-between gap-3 py-6">
              <Link
                className="backdrop-plate -ml-2 inline-flex h-9 items-center gap-0.5 rounded-md pr-3 pl-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                href="/blog"
                transitionTypes={[
                  "pop",
                ]}
                data-sound="tap"
                data-analytics-event="Navigation Clicked"
                data-analytics-destination="Blog"
                data-analytics-location="Reader Header"
              >
                <RiArrowLeftSLine className="size-5" aria-hidden="true" />
                Writing
              </Link>
              <div className="flex items-center gap-1.5">
                <ThemeSwitcher />
                <SoundToggle />
              </div>
            </header>
            {children}
            <SiteSocialLinks />
          </div>
        </div>
      </PlatformProvider>
      <DeferredAnalytics />
      <AnalyticsEvents />
      <SiteSounds />
    </ThemeProvider>
  );
}
