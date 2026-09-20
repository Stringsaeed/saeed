import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    "192.168.1.123",
  ],
  images: {
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
};

export default nextConfig;
