import type { Metadata, Viewport } from "next";
import StudioLoader from "./studio-loader";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js reads this segment config.
export const dynamic = "force-static";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js reads this metadata export.
export const metadata: Metadata = {
  referrer: "same-origin",
  robots: "noindex",
};

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js reads this viewport export.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function StudioPage() {
  return <StudioLoader />;
}
