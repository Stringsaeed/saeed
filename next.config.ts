import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    "192.168.1.123",
  ],
  images: {
    // AVIF first: the stickers are transparent PNGs, where it saves the most.
    formats: [
      "image/avif",
      "image/webp",
    ],
    qualities: [
      75,
      90,
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.google.com",
        pathname: "/s2/favicons",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  outputFileTracingIncludes: {
    "/": [
      "./src/content/blog/**/*.mdx",
    ],
    "/blog": [
      "./src/content/blog/**/*.mdx",
    ],
    "/blog/[slug]": [
      "./src/content/blog/**/*.mdx",
    ],
    "/blog/[slug]/opengraph-image": [
      "./src/content/blog/**/*.mdx",
    ],
    "/feed.xml": [
      "./src/content/blog/**/*.mdx",
    ],
    "/sitemap.xml": [
      "./src/content/blog/**/*.mdx",
    ],
  },
  reactCompiler: true,
  // PostHog's API paths end in a slash; redirecting them would drop events.
  skipTrailingSlashRedirect: true,
  // PostHog through our own domain, so blockers that drop requests to
  // posthog.com keep the analytics and the sticker desk experiment.
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // The sticker desk used to have its own page; it now opens over any page
  // from the corner pile, so old links land on the home page.
  async redirects() {
    return [
      {
        source: "/stickers",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
