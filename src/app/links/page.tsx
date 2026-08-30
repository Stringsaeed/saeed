import type { Metadata } from "next";
import links from "@/data/links.json";
import { siteName } from "@/lib/site";

type LinkEntry = {
	website: string;
	type: string;
	url: string;
	description: string;
};

const entries = links satisfies LinkEntry[];
const description = `${entries.length} saved websites, tools, articles, and references collected by Saeed.`;

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
	title: "Links",
	description,
	alternates: {
		canonical: "/links",
	},
	openGraph: {
		type: "website",
		url: "/links",
		title: `Links | ${siteName}`,
		description,
	},
	twitter: {
		card: "summary_large_image",
		title: `Links | ${siteName}`,
		description,
	},
};

export default function LinksPage() {
	return (
		<main
			className="flex min-h-0 flex-1 flex-col pb-4 pt-6 sm:pb-6 sm:pt-8"
			data-layout-fill
		>
			<div className="shrink-0">
				<h1
					className="text-2xl font-semibold tracking-[-0.035em]"
					data-analytics-view="Content Viewed"
					data-analytics-label="Links Archive"
				>
					Links
				</h1>
				<p className="mt-3 max-w-[36rem] text-sm leading-6 text-muted-foreground">
					{description}
				</p>
			</div>

			<div className="relative left-1/2 mt-6 min-h-0 w-[min(56rem,calc(100vw-1.5rem))] -translate-x-1/2 flex-1 overflow-auto overscroll-contain rounded-lg border border-border bg-background/80">
				<table className="w-full min-w-[52rem] table-fixed text-left text-xs leading-5">
					<caption className="sr-only">
						Saved websites and tools with category, URL, and notes.
					</caption>
					<colgroup>
						<col className="w-[23%]" />
						<col className="w-[13%]" />
						<col className="w-[26%]" />
						<col className="w-[38%]" />
					</colgroup>
					<thead>
						<tr className="border-b border-border text-muted-foreground">
							<th
								className="sticky top-0 z-10 bg-muted/95 px-3 py-2 font-medium backdrop-blur-sm"
								scope="col"
							>
								Website
							</th>
							<th
								className="sticky top-0 z-10 bg-muted/95 px-3 py-2 font-medium backdrop-blur-sm"
								scope="col"
							>
								Type
							</th>
							<th
								className="sticky top-0 z-10 bg-muted/95 px-3 py-2 font-medium backdrop-blur-sm"
								scope="col"
							>
								URL
							</th>
							<th
								className="sticky top-0 z-10 bg-muted/95 px-3 py-2 font-medium backdrop-blur-sm"
								scope="col"
							>
								Note
							</th>
						</tr>
					</thead>
					<tbody>
						{entries.map((entry) => (
							<tr
								key={entry.url}
								className="border-b border-border/70 align-top transition-colors duration-150 last:border-b-0 hover:bg-muted/50"
							>
								<td className="px-3 py-3 font-medium">
									<a
										className="text-link underline-offset-4 hover:underline"
										href={entry.url}
										target="_blank"
										rel="noreferrer"
										data-analytics-event="Saved Link Clicked"
										data-analytics-label={entry.website}
										data-analytics-type={entry.type}
										data-analytics-location="Links Archive"
									>
										{entry.website}
									</a>
								</td>
								<td className="px-3 py-3 text-muted-foreground">
									{entry.type}
								</td>
								<td className="px-3 py-3">
									<a
										className="block truncate text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground"
										href={entry.url}
										target="_blank"
										rel="noreferrer"
										title={entry.url}
										data-analytics-event="Saved Link Clicked"
										data-analytics-label={entry.website}
										data-analytics-type={entry.type}
										data-analytics-location="Links Archive"
									>
										{entry.url}
									</a>
								</td>
								<td className="px-3 py-3 text-muted-foreground">
									{entry.description}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</main>
	);
}
