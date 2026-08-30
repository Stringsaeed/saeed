import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { aboutContent } from "@/content/site-content";
import { siteName } from "@/lib/site";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
	title: "About",
	description: aboutContent.description,
	alternates: {
		canonical: "/about",
	},
	openGraph: {
		type: "profile",
		url: "/about",
		title: `About | ${siteName}`,
		description: aboutContent.description,
	},
};

export default function AboutPage() {
	return <ContentPage content={aboutContent} />;
}
