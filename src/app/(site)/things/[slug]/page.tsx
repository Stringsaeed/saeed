import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { AppWindow } from "@/components/os/app-window";
import { findThing, things } from "@/data/things";
import { siteName } from "@/lib/site";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js prerenders every thing from this list.
export function generateStaticParams() {
  return things.map((thing) => ({
    slug: thing.slug,
  }));
}

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const thing = findThing(slug);
  if (!thing) notFound();
  return {
    title: thing.title,
    description: thing.story[0],
    alternates: {
      canonical: `/things/${thing.slug}`,
    },
    openGraph: {
      type: "article",
      url: `/things/${thing.slug}`,
      title: `${thing.title} | ${siteName}`,
      description: thing.story[0],
    },
  };
}

export default async function ThingPage({ params }: Props) {
  const { slug } = await params;
  const thing = findThing(slug);
  if (!thing) notFound();
  return (
    <AppWindow
      title={thing.title}
      icon={null}
      back={{
        href: "/things",
        label: "Things",
        kind: "pop",
      }}
      analyticsLabel={`Thing ${thing.title}`}
    >
      <ViewTransition
        name={`thing-${thing.id}`}
        share="app-morph"
        default="none"
      >
        <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-[var(--os-card-radius)] bg-[color:var(--os-card)] p-8">
          <Image
            src={thing.src}
            alt={thing.label}
            width={thing.width}
            height={thing.height}
            sizes="360px"
            priority
            className="max-h-full w-auto max-w-full object-contain drop-shadow-md"
          />
        </div>
      </ViewTransition>
      <p className="mt-5 px-1 text-[13px] font-medium uppercase tracking-wide text-[color:var(--os-text-2)]">
        {thing.caption}
      </p>
      <div className="mt-3 space-y-4 px-1 text-[17px] leading-[1.55]">
        {thing.story.map((paragraph) => (
          <p key={paragraph.slice(0, 32)}>{paragraph}</p>
        ))}
      </div>
    </AppWindow>
  );
}
