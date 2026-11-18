import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { AgentTools } from "@/components/agent-tools";
import { AnalyticsEvents } from "@/components/analytics-events";
import { DeferredAnalytics } from "@/components/deferred-analytics";
import { Frame } from "@/components/terminal/frame";
import { ThemeProvider } from "@/components/theme-provider";
import { getLinks, getPosts } from "@/lib/content";
import { isHttpsUrl } from "@/lib/https-url";

// The terminal version of the site: every page of the regular site, again,
// as a tab in one terminal window. The frame (tabs, the git client, the
// shell) lives here so it stays put from page to page; each page under
// /terminal renders what goes in its own tab.

// Paper Mono is the only face the terminal sets, so here it is preloaded
// and on the page from the first paint. The regular site declares the same
// file in the root layout and loads it late, for its dates and labels.
const paperMono = localFont({
  src: "../../fonts/paper-mono.woff2",
  weight: "100 800",
  variable: "--font-terminal",
  adjustFontFallback: false,
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "monospace",
  ],
});

// The regular site is the one to find and to share: these pages point at
// their twins there (each sets its own canonical) and stay out of search.
// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a layout.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default async function TerminalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [posts, links] = await Promise.all([
    getPosts(),
    getLinks(),
  ]);
  return (
    // The terminal is dark, whatever theme a visitor keeps on the regular
    // site; that is also what picks the dark colours for a post's code.
    <ThemeProvider attribute="class" forcedTheme="dark">
      <div className={paperMono.variable}>
        <Frame
          data={{
            posts: posts.map((post) => ({
              slug: post.slug,
              title: post.title,
              date: post.date,
              description: post.description,
              tags: post.tags,
            })),
            links: links
              .filter((entry) => isHttpsUrl(entry.url))
              .map((entry) => ({
                website: entry.website,
                type: entry.type,
                url: entry.url,
              })),
          }}
        >
          {children}
        </Frame>
      </div>
      <DeferredAnalytics />
      <AnalyticsEvents />
      <AgentTools />
    </ThemeProvider>
  );
}
