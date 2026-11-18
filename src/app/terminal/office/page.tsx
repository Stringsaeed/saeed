import type { Metadata } from "next";
import { Office } from "@/components/desk/office";
import { tabStyles } from "@/components/terminal/tab-styles";
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
    // The room fills its tab; the frame gives this page a pane with no
    // padding and keeps its own keys out of the way.
    <main className={tabStyles.room}>
      <h1
        className="sr-only"
        data-analytics-view="Content Viewed"
        data-analytics-label="Office"
      >
        Office
      </h1>
      <Office />
    </main>
  );
}
