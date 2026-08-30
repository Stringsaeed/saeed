import Link from "next/link";

export default function NotFound() {
	return (
		<main className="pb-20 pt-10 sm:pt-14">
			<p className="font-mono text-xs text-muted-foreground">404</p>
			<h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">
				Page not found
			</h1>
			<p className="mt-4 max-w-[36rem] text-base leading-7 text-muted-foreground">
				This address does not match a page on the site. Start from the home
				page, browse the writing archive, or use the machine-readable indexes
				below.
			</p>
			<ul className="mt-6 space-y-2 text-sm">
				<li>
					<Link className="text-link" href="/">
						Home
					</Link>
				</li>
				<li>
					<Link className="text-link" href="/blog">
						Blog archive
					</Link>
				</li>
				<li>
					<a className="text-link" href="/sitemap.xml">
						XML sitemap
					</a>
				</li>
				<li>
					<a className="text-link" href="/llms.txt">
						Agent index
					</a>
				</li>
			</ul>
		</main>
	);
}
