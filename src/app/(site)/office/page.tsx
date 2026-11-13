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
      {/* The scene fills the window behind the header. The page is told to
          be exactly one window tall (data-layout-fill), so the footer lies
          over the scene's foot instead of adding a strip to scroll to, and
          the main lets the pointer through to the scene. */}
      <main className="pointer-events-none min-h-0 flex-1" data-layout-fill>
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
