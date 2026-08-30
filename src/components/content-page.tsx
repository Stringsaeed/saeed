import type { TrustPageContent } from "@/content/site-content";

type ContentPageProps = {
	content: TrustPageContent;
	children?: React.ReactNode;
};

export function ContentPage({ content, children }: ContentPageProps) {
	return (
		<main className="pb-20 pt-10 sm:pt-14">
			<h1 className="max-w-[38rem] text-2xl leading-tight font-semibold tracking-[-0.035em] sm:text-3xl">
				{content.title}
			</h1>
			<div className="mt-5 max-w-[42rem] space-y-4 text-base leading-7 text-muted-foreground">
				{content.intro.map((paragraph) => (
					<p key={paragraph}>{paragraph}</p>
				))}
			</div>

			{children}

			<div className="mt-10 max-w-[42rem] space-y-10">
				{content.sections.map((section) => (
					<section key={section.title}>
						<h2 className="text-lg font-semibold tracking-[-0.025em]">
							{section.title}
						</h2>
						<div className="mt-3 space-y-4 text-base leading-7 text-muted-foreground">
							{section.paragraphs.map((paragraph) => (
								<p key={paragraph}>{paragraph}</p>
							))}
						</div>
					</section>
				))}
			</div>
		</main>
	);
}
