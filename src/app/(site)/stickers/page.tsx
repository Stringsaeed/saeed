import type { Metadata } from "next";
import { ViewTransition } from "react";
import { StickerDesk } from "@/components/sticker-desk";
import { siteName } from "@/lib/site";

const description = "The things on Saeed's desk, and the stories behind them.";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
  title: "Desk",
  description,
  alternates: {
    canonical: "/stickers",
  },
  openGraph: {
    type: "website",
    url: "/stickers",
    title: `Desk | ${siteName}`,
    description,
  },
};

export default function StickersPage() {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <main className="pb-20 pt-10 sm:pt-14">
        <StickerDesk />
      </main>
    </ViewTransition>
  );
}
