import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	outputFileTracingIncludes: {
		"/api/markdown/*": [
			"./src/content/blog/*.mdx",
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

const withMDX = createMDX();

export default withMDX(nextConfig);
