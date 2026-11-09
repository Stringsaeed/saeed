"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AnimatedAvatar } from "@/components/animated-avatar";
import { SaeedName } from "@/components/saeed-name";
import { SiteSocialLinks } from "@/components/site-header";
import { SoundToggle } from "@/components/sound-toggle";
import { ThemeSwitcher } from "@/components/theme-switcher-trigger";
import { builtInApps } from "@/data/apps";
import { cn } from "@/lib/utils";
import { PlatformSwitcher } from "./platform-switcher";

// The web target: no phone, just the same screens as pages with a nav.
// react-native-web for a portfolio.

const navApps = builtInApps.filter((app) => app.id !== "settings");

export function WebShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="os-web">
      <header className="mx-auto flex w-full max-w-[44rem] flex-wrap items-center gap-x-4 gap-y-3 px-6 py-6">
        <Link
          className="flex shrink-0 items-center gap-3"
          href="/"
          data-sound="tap"
          data-analytics-event="Navigation Clicked"
          data-analytics-destination="Home"
          data-analytics-location="Header"
        >
          <AnimatedAvatar />
          <SaeedName className="signature-name" />
        </Link>
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeSwitcher />
          <SoundToggle />
        </div>
        <nav
          className="flex w-full flex-wrap items-center gap-x-1 gap-y-1 text-sm"
          aria-label="Site"
        >
          {navApps.map((app) => {
            const active =
              app.href === "/"
                ? pathname === "/"
                : pathname === app.href || pathname.startsWith(`${app.href}/`);
            return (
              <Link
                key={app.id}
                href={app.href}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-hover hover:text-foreground",
                  active && "bg-hover text-foreground",
                )}
                aria-current={active ? "page" : undefined}
                data-sound="tap"
                data-analytics-event="Navigation Clicked"
                data-analytics-destination={app.name}
                data-analytics-location="Header"
              >
                {app.name}
              </Link>
            );
          })}
          <PlatformSwitcher className="ml-auto" location="Web Header" />
        </nav>
      </header>
      <main className="os-web-main flex-1">{children}</main>
      <div className="mx-auto w-full max-w-[44rem] px-6">
        <SiteSocialLinks />
      </div>
    </div>
  );
}
