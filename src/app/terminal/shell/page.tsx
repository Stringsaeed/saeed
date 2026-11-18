import type { Metadata } from "next";

// The shell tab. The terminal itself is drawn by the layout's frame, where
// it keeps its session while other tabs are in front; this page only gives
// the tab an address and a name.
// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
  title: "Shell",
  description: "The site as a shell: its pages as files, with a script each.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function ShellPage() {
  return <h1 className="sr-only">Shell</h1>;
}
