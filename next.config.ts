import createMDX from "@next/mdx";
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
    ],
  },
  pageExtensions: [
    "js",
    "jsx",
    "md",
    "mdx",
    "ts",
    "tsx",
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
