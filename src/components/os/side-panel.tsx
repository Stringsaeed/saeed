"use client";

import {
  RiBlueskyFill,
  RiDownloadLine,
  RiGithubFill,
  RiLinkedinFill,
  RiMailLine,
  RiTwitterXFill,
} from "@remixicon/react";
import { AnimatedAvatar } from "@/components/animated-avatar";
import { SaeedName } from "@/components/saeed-name";
import { SoundToggle } from "@/components/sound-toggle";
import { ThemeSwitcher } from "@/components/theme-switcher-trigger";
import { Button } from "@/components/ui/button";
import { PlatformSwitcher } from "./platform-switcher";

// What sits beside the phone on a desktop: who I am, in a few lines, and the
// platform switch. On a phone the About widget says the same thing.

const contacts = [
  {
    label: "Email",
    href: "mailto:stringsaeed@gmail.com",
    icon: RiMailLine,
  },
  {
    label: "GitHub",
    href: "https://github.com/stringsaeed",
    icon: RiGithubFill,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/stringsaeed",
    icon: RiLinkedinFill,
  },
  {
    label: "X",
    href: "https://x.com/stringsaeed",
    icon: RiTwitterXFill,
  },
  {
    label: "Bluesky",
    href: "https://bsky.app/profile/saeed.guru",
    icon: RiBlueskyFill,
  },
];

export function SidePanel() {
  return (
    <aside className="os-panel" aria-label="About this site">
      <div className="flex items-center gap-3">
        <AnimatedAvatar />
        <SaeedName className="signature-name" />
      </div>
      <h2 className="mt-10 max-w-[14ch] text-balance text-[clamp(2.25rem,3.4vw,3.25rem)] leading-[1.02] font-semibold tracking-[-0.04em]">
        I build the apps on your phone.
      </h2>
      <p className="mt-6 max-w-[42ch] text-[17px] leading-7 text-muted-foreground">
        Senior software engineer in Dubai. Seven years of React Native, Swift,
        and Kotlin for Thndr, Nomo, Dubizzle, Breadfast, and du, plus a shelf
        of side projects.
      </p>
      <p className="mt-3 max-w-[42ch] text-[15px] leading-6 text-muted-foreground/80">
        This site is a phone. Open the apps, swipe the pages, press the side
        button to lock it. Pick a platform and watch it change its clothes.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <PlatformSwitcher className="min-w-[17rem]" location="Side Panel" />
        <div className="flex items-center gap-1.5">
          <ThemeSwitcher />
          <SoundToggle />
        </div>
      </div>
      <ul className="mt-10 flex flex-wrap items-center gap-1" aria-label="Contact links">
        {contacts.map((item) => (
          <li key={item.label}>
            <Button asChild variant="tertiary" size="icon">
              <a
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                aria-label={item.label}
                title={item.label}
                data-sound="tap"
                data-sound-hover="hover"
                data-analytics-event="Social Link Clicked"
                data-analytics-network={item.label}
                data-analytics-location="Side Panel"
              >
                <item.icon data-icon="inline-start" aria-hidden="true" />
              </a>
            </Button>
          </li>
        ))}
        <li>
          <Button asChild variant="tertiary" size="compact">
            <a
              href="/cv.pdf"
              download
              data-sound="download"
              data-analytics-event="CV Download Clicked"
              data-analytics-location="Side Panel"
            >
              <RiDownloadLine data-icon="inline-start" aria-hidden="true" />
              CV
            </a>
          </Button>
        </li>
      </ul>
    </aside>
  );
}
