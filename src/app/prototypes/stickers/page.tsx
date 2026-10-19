import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VARIANTS } from "./_variants/registry";
import { StickerPrototypeHarness } from "./harness";

// Prototype surface (emilkowalski/prototype) for the sticker desk directions
// kept for later. Dev only: production builds answer 404. Nothing in the
// site imports from here.
// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
  title: "Sticker prototypes",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function StickerPrototypesPage({
  searchParams,
}: {
  searchParams: Promise<{
    v?: string;
  }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { v } = await searchParams;
  const parsed = Number.parseInt(v ?? "", 10);
  const initialIndex =
    parsed >= 1 && parsed <= VARIANTS.length ? parsed - 1 : 0;
  return <StickerPrototypeHarness initialIndex={initialIndex} />;
}
