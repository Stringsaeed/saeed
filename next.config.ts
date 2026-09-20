import createMDX from "@next/mdx";
import type { NextConfig } from "next";

// *.dev.ts(x) routes exist only for `next dev`, so /keystatic is not in the production build.
const devOnlyExtensions =
  process.env.NODE_ENV === "development"
    ? [
        "dev.js",
        "dev.jsx",
        "dev.ts",
        "dev.tsx",
      ]
    : [];

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
    ],
  },
  pageExtensions: [
    "js",
    "jsx",
    "md",
    "mdx",
    "ts",
    "tsx",
    ...devOnlyExtensions,
  ],
  reactCompiler: true,
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [
      "remark-frontmatter",
    ],
  },
});

export default withMDX(nextConfig);
