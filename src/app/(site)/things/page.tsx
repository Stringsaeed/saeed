import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { AppWindow } from "@/components/os/app-window";
import { findBuiltInApp } from "@/data/apps";
import { things } from "@/data/things";
import { siteName } from "@/lib/site";

const description =
  "Eight things that say something about me: the pyramids, the Burj Khalifa, a bass, a keyboard, a PlayStation, two monsteras, a pencil, and a perfume.";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
  title: "Things",
  description,
  alternates: {
    canonical: "/things",
  },
  openGraph: {
    type: "website",
    url: "/things",
    title: `Things | ${siteName}`,
    description,
  },
};

export default function ThingsPage() {
  const app = findBuiltInApp("things");
  return (
    <AppWindow
      app={app}
      title="Things"
      lede="I grew up beside the pyramids and live under the Burj. I listen for the bass first, type on a keyboard because I’m a 90s kid, still play PlayStation since Winning Eleven, water two monsteras every morning, keep a pencil that reminds me of my father, and leave rooms smelling of Babylon."
    >
      <ul className="grid grid-cols-2 gap-3">
        {things.map((thing) => (
          <li key={thing.id}>
            <Link
              href={`/things/${thing.slug}`}
              transitionTypes={[
                "push",
              ]}
              className="group flex flex-col gap-2 rounded-[var(--os-card-radius)] bg-[color:var(--os-card)] p-3 transition-transform active:scale-[0.98]"
              data-sound="tap"
              data-analytics-event="Thing Opened"
              data-analytics-label={thing.title}
            >
              <ViewTransition
                name={`thing-${thing.id}`}
                share="app-morph"
                default="none"
              >
                <span className="grid aspect-[4/3] place-items-center overflow-hidden rounded-[10px] bg-[color:var(--os-card-2)] p-3">
                  <Image
                    src={thing.src}
                    alt={thing.label}
                    width={thing.width}
                    height={thing.height}
                    sizes="160px"
                    className="max-h-full w-auto max-w-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105"
                  />
                </span>
              </ViewTransition>
              <span className="px-0.5">
                <span className="block text-[15px] font-semibold leading-tight">
                  {thing.title}
                </span>
                <span className="mt-0.5 block text-[13px] leading-snug text-[color:var(--os-text-2)]">
                  {thing.caption}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </AppWindow>
  );
}
