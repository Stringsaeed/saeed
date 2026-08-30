import Link from "next/link";

const footerLinks = [
	{
		label: "About",
		href: "/about",
	},
	{
		label: "Contact",
		href: "/contact",
	},
	{
		label: "Privacy",
		href: "/privacy",
	},
	{
		label: "RSS",
		href: "/feed.xml",
	},
] as const;

export function SiteFooter() {
	return (
		<footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border py-6 text-xs text-muted-foreground">
			<span>Muhammed Saeed</span>
			<nav
				className="flex flex-wrap items-center gap-x-3"
				aria-label="Site information"
			>
				{footerLinks.map((link) => (
					<Link
						key={link.href}
						className="text-link"
						href={link.href}
						data-analytics-event="Navigation Clicked"
						data-analytics-destination={link.label}
						data-analytics-location="Footer"
					>
						{link.label}
					</Link>
				))}
			</nav>
		</footer>
	);
}
