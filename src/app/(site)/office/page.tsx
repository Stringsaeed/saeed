import type { Metadata } from "next";
import { ViewTransition } from "react";
import { Office } from "@/components/desk/office";
import { siteName } from "@/lib/site";

const officeDescription =
  "Saeed's office as a room you can stand in: the things he keeps around, a projector, and two cats called Sono and Bosha.";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
  title: "Office",
  description: officeDescription,
  alternates: {
    canonical: "/office",
  },
  openGraph: {
    type: "website",
    url: "/office",
    title: `Office | ${siteName}`,
    description: officeDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `Office | ${siteName}`,
    description: officeDescription,
  },
};

export default function OfficePage() {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {/* The scene fills the window behind the header, so the page itself
          only has to be as tall as the window and let the pointer through. */}
      <main className="pointer-events-none min-h-[calc(100dvh-5.5rem)] flex-1">
        <h1
          className="sr-only"
          data-analytics-view="Content Viewed"
          data-analytics-label="Office"
        >
          Office
        </h1>
        <Office />
      </main>
    </ViewTransition>
  );
}
