import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { privacyContent } from "@/content/site-content";
import { siteName } from "@/lib/site";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
	title: "Privacy",
	description: privacyContent.description,
	alternates: {
		canonical: "/privacy",
	},
	openGraph: {
		type: "website",
		url: "/privacy",
		title: `Privacy | ${siteName}`,
		description: privacyContent.description,
	},
};

export default function PrivacyPage() {
	return <ContentPage content={privacyContent} />;
}
