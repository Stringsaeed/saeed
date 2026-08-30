"use client";

import {
  RiArticleLine,
  RiBlueskyFill,
  RiDownloadLine,
  RiGithubFill,
  RiLinksLine,
  RiLinkedinFill,
  RiMailLine,
  RiTwitterXFill,
} from "@remixicon/react";
import Link from "next/link";
import { AnimatedAvatar } from "./animated-avatar";
import { Button } from "./ui/button";

const socialLinks = [
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

export function SiteHeader() {
  return (
    <header className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
      <Link
        className="flex self-start items-center gap-3 sm:self-auto"
        href="/"
        data-analytics-event="Navigation Clicked"
        data-analytics-destination="Home"
        data-analytics-location="Header"
      >
        <AnimatedAvatar />
        <span className="signature-name">Saeed</span>
      </Link>

      <nav className="flex items-center gap-1" aria-label="Site links">
        <Button asChild variant="ghost" leadingIcon={RiArticleLine}>
          <Link
            href="/blog"
            data-analytics-event="Navigation Clicked"
            data-analytics-destination="Blog"
            data-analytics-location="Header"
          >
            Blog
          </Link>
        </Button>
        <Button asChild variant="ghost" leadingIcon={RiLinksLine}>
          <Link
            href="/links"
            data-analytics-event="Navigation Clicked"
            data-analytics-destination="Links"
            data-analytics-location="Header"
          >
            Links
          </Link>
        </Button>
      </nav>
    </header>
  );
}

export function SiteSocialLinks() {
  return (
    <footer className="mt-auto flex justify-end pb-6">
      <nav className="flex flex-wrap items-center gap-1" aria-label="Social links">
        {socialLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.label}
              asChild
              variant="tertiary"
              size="icon"
            >
              <a
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                aria-label={item.label}
                title={item.label}
                data-analytics-event="Social Link Clicked"
                data-analytics-network={item.label}
                data-analytics-location="Layout Bottom"
              >
                <Icon data-icon="inline-start" aria-hidden="true" />
              </a>
            </Button>
          );
        })}
        <Button
          asChild
          variant="tertiary"
          size="icon"
        >
          <a
            href="/cv.pdf"
            download
            aria-label="Download CV"
            title="Download CV"
            data-analytics-event="CV Download Clicked"
            data-analytics-location="Layout Bottom"
          >
            <RiDownloadLine data-icon="inline-start" aria-hidden="true" />
          </a>
        </Button>
      </nav>
    </footer>
  );
}
