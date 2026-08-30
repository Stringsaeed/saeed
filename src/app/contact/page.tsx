import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { contactContent, identity } from "@/content/site-content";
import { siteName } from "@/lib/site";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
	title: "Contact",
	description: contactContent.description,
	alternates: {
		canonical: "/contact",
	},
	openGraph: {
		type: "website",
		url: "/contact",
		title: `Contact | ${siteName}`,
		description: contactContent.description,
	},
};

export default function ContactPage() {
	return (
		<ContentPage content={contactContent}>
			<a
				className="text-link mt-6 inline-flex text-base font-medium"
				href={`mailto:${identity.email}`}
				data-analytics-event="Contact Clicked"
				data-analytics-location="Contact Page"
			>
				Email {identity.email}
			</a>
		</ContentPage>
	);
}
