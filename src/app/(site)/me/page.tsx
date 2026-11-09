import {
  RiBlueskyFill,
  RiDownloadLine,
  RiGithubFill,
  RiLinkedinFill,
  RiMailLine,
  RiPhoneLine,
  RiTwitterXFill,
} from "@remixicon/react";
import type { Metadata } from "next";
import Image from "next/image";
import { ViewTransition } from "react";
import { AppWindow } from "@/components/os/app-window";
import { ListGroup, ListRow, StaticRow } from "@/components/os/os-list";
import { SaeedName } from "@/components/saeed-name";
import { findBuiltInApp } from "@/data/apps";
import { siteName } from "@/lib/site";

const description =
  "Muhammed Ibrahim, known as Saeed: a senior software engineer in Dubai working in React Native, TypeScript, Swift, and Kotlin.";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
  title: "Me",
  description,
  alternates: {
    canonical: "/me",
  },
  openGraph: {
    type: "profile",
    url: "/me",
    title: `Me | ${siteName}`,
    description,
  },
};

const contacts = [
  {
    label: "Email",
    value: "stringsaeed@gmail.com",
    href: "mailto:stringsaeed@gmail.com",
    icon: RiMailLine,
    network: "Email",
  },
  {
    label: "Phone",
    value: "+971 50 838 7822",
    href: "tel:+971508387822",
    icon: RiPhoneLine,
    network: "Phone",
  },
  {
    label: "GitHub",
    value: "stringsaeed",
    href: "https://github.com/stringsaeed",
    icon: RiGithubFill,
    network: "GitHub",
  },
  {
    label: "LinkedIn",
    value: "in/stringsaeed",
    href: "https://linkedin.com/in/stringsaeed",
    icon: RiLinkedinFill,
    network: "LinkedIn",
  },
  {
    label: "X",
    value: "@stringsaeed",
    href: "https://x.com/stringsaeed",
    icon: RiTwitterXFill,
    network: "X",
  },
  {
    label: "Bluesky",
    value: "saeed.guru",
    href: "https://bsky.app/profile/saeed.guru",
    icon: RiBlueskyFill,
    network: "Bluesky",
  },
];

export default function MePage() {
  const app = findBuiltInApp("me");
  return (
    <AppWindow app={app} title="Me" icon={null} analyticsLabel="About">
      <div className="flex flex-col items-center px-2 pt-2 pb-6 text-center">
        <ViewTransition name="app-me" share="app-morph" default="none">
          <span className="relative block size-[112px] overflow-hidden rounded-full shadow-[0_18px_40px_-16px_rgb(0_0_0/0.45)] ring-1 ring-black/10">
            <Image
              src="/static/color.svg"
              alt=""
              width={112}
              height={112}
              priority
              unoptimized
            />
          </span>
        </ViewTransition>
        <p className="mt-5 text-[13px] text-[color:var(--os-text-2)]">
          Muhammed Ibrahim, but everyone says
        </p>
        <p className="saeed-name mt-6 block text-[48px]">
          <SaeedName />
        </p>
        <p className="mt-8 max-w-[34ch] text-[17px] leading-[1.45]">
          Senior software engineer in Dubai. I’ve spent seven years building
          mobile apps in React Native, with Swift and Kotlin where it mattered,
          for fintech, banking, classifieds, and grocery delivery.
        </p>
        <p className="mt-3 max-w-[34ch] text-[15px] leading-[1.45] text-[color:var(--os-text-2)]">
          Lately I spend a lot of time on agent-assisted engineering: how a
          small team ships more without shipping worse.
        </p>
        <a
          className="os-button mt-6 min-w-[11rem]"
          href="/cv.pdf"
          download
          data-sound="download"
          data-analytics-event="CV Download Clicked"
          data-analytics-location="Me App"
        >
          <RiDownloadLine aria-hidden="true" />
          Download CV
        </a>
      </div>

      <ListGroup title="Reach me">
        {contacts.map((item) => {
          const Icon = item.icon;
          const external = item.href.startsWith("http");
          return (
            <ListRow
              key={item.label}
              href={item.href}
              external={external}
              leading={
                <span className="grid size-9 place-items-center rounded-[10px] bg-[color:var(--os-card-2)] text-[color:var(--os-text)]">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              }
              title={item.label}
              subtitle={item.value}
              chevron
              data-sound="tap"
              data-analytics-event="Social Link Clicked"
              data-analytics-network={item.network}
              data-analytics-location="Me App"
            />
          );
        })}
      </ListGroup>

      <ListGroup title="Elsewhere">
        <StaticRow title="Based in" trailing="Dubai, UAE" />
        <StaticRow title="From" trailing="Giza, Egypt" />
        <StaticRow title="Languages" trailing="Arabic, English" />
        <StaticRow title="Degree" trailing="B.Sc. Computer Science" />
      </ListGroup>
    </AppWindow>
  );
}
