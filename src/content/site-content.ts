export type ContentSection = {
	title: string;
	paragraphs: readonly string[];
};

export type TrustPageContent = {
	title: string;
	description: string;
	intro: readonly string[];
	sections: readonly ContentSection[];
};

export const identity = {
	fullName: "Muhammed Saeed",
	shortName: "Saeed",
	role: "Software engineer",
	location: "Dubai, United Arab Emirates",
	email: "stringsaeed@gmail.com",
} as const;

export const homeIntroduction = [
	"I work on React Native, TypeScript, performance, accessibility, native code, and agent-assisted engineering.",
	"I have spent more than seven years building mobile products across investing, property, digital banking, grocery delivery, and commerce. My recent work includes ADX order flows at Thndr, cross-platform reliability and billing at Dubizzle, open-banking journeys at Nomo, and mobile stability at Breadfast.",
	"This site is my working archive. It collects practical notes about mobile engineering, software delivery, and using agents without skipping planning, review, or real verification. You can also find selected work, saved technical references, my CV, and the public profiles I use elsewhere.",
] as const;

export const homeFocus: readonly ContentSection[] = [
	{
		title: "Mobile product engineering",
		paragraphs: [
			"Most of my production work is in React Native and TypeScript. I follow a feature through the JavaScript layer, native iOS and Android behavior, API boundaries, analytics, accessibility, and release tooling instead of treating the screen as the whole product. When a problem crosses that boundary, I use Swift, Kotlin, Java, Objective-C, Xcode, Android Studio, or platform profiling tools to find the real cause.",
			"Performance work starts with evidence. That can mean measuring cold start, tracing a slow interaction, checking frame timing, reducing unnecessary renders, inspecting bundle size, or separating JavaScript work from native work. The goal is a measured improvement in the flow a person uses, not a list of generic optimizations.",
		],
	},
	{
		title: "Reliable delivery",
		paragraphs: [
			"I have worked on products where a failed release affects investing, banking, property listings, or a daily grocery order. I value small changes, clear ownership, error boundaries, useful recovery states, focused tests, and release checks that another engineer can repeat. Accessibility belongs in the same definition of done because a flow that excludes someone is not complete.",
			"The less visible work matters too. I have maintained mobile build pipelines, upgraded platform SDKs, moved components into shared design systems, stabilized inherited applications, mentored engineers, and documented critical workflows. Those tasks reduce the number of surprises between a feature branch and the product people use.",
		],
	},
	{
		title: "Agent-assisted engineering",
		paragraphs: [
			"I use coding agents daily, but I do not treat faster implementation as proof that a change is ready. My preferred loop defines the problem, records acceptance criteria, separates independent work, reviews the result against both the specification and the repository's standards, then drives the real product. A human still owns the tradeoffs and decides what ships.",
			"The articles here document that workflow as it changes. They cover agent roles, planning, verification, code review, the limits of model output, and what software teams need to change when implementation becomes faster than planning or QA. They are working notes grounded in the tools and processes I use, not a claim that one setup fits every team.",
		],
	},
];

export const work = [
	{
		company: "Thndr",
		period: "2025 to 2026",
		href: "https://thndr.app/",
		logo: "/work/thndr.png",
		brand: "#ffff00",
		description:
			"ADX order flows and shared market configuration for Egypt, US equities, and Abu Dhabi.",
	},
	{
		company: "Dubizzle",
		period: "2024 to 2025",
		href: "https://www.dubizzle.com/",
		logo: "/work/dubizzle.png",
		brand: "#ed0000",
		description:
			"Listings, stability, ratings, SDK upgrades, and billing across mobile and web.",
	},
	{
		company: "Nomo",
		period: "2023 to 2024",
		href: "https://nomobank.com/",
		logo: "/work/nomo.png",
		brand: "#bde8c6",
		description:
			"Digital banking for customers across Kuwait, the UAE, and the GCC.",
	},
	{
		company: "Breadfast",
		period: "2022 to 2023",
		href: "https://www.breadfast.com/",
		logo: "/work/breadfast.png",
		brand: "#b6008b",
		description:
			"Mobile reliability while the grocery product grew beyond one million active users.",
	},
] as const;

export const aboutContent: TrustPageContent = {
	title: "About Muhammed Saeed",
	description:
		"Background, experience, and engineering interests for Muhammed Saeed, a software engineer in Dubai.",
	intro: [
		"I am Muhammed Saeed, usually Saeed, a software engineer based in Dubai. I build mobile products with React Native and TypeScript, and I work in Swift, Kotlin, Java, or Objective-C when a feature needs native code. My main interests are performance, accessibility, reliable product delivery, and the practical use of coding agents.",
	],
	sections: [
		{
			title: "Experience",
			paragraphs: [
				"I started professional mobile development in 2019. Since then I have worked on commerce, grocery delivery, digital banking, property marketplaces, and investing products. Recent roles include Thndr, Dubizzle, Nomo, and Breadfast. The work has ranged from market order flows and open-banking journeys to crash recovery, design-system migrations, SDK upgrades, build pipelines, and release infrastructure.",
				"I care about the parts of engineering that users notice even when they cannot name them: a screen that stays responsive, a failure that explains how to recover, an interface that works with assistive technology, and a release process that does not depend on luck.",
			],
		},
		{
			title: "How I work",
			paragraphs: [
				"My current workflow uses agents for research, planning, implementation, review, and QA, while keeping a human responsible for the goal and release decision. I prefer small, reviewable changes with explicit acceptance criteria and evidence from the running product. Faster code is useful only when the rest of the delivery loop stays trustworthy.",
			],
		},
		{
			title: "Open source and writing",
			paragraphs: [
				"I have contributed to React Native projects and documentation, and I maintain small libraries and experiments around mobile interfaces. I also write about React Native, software engineering careers, and agent-assisted development. The blog on this site is the best index of that writing, while GitHub contains the code and issue history behind the work.",
			],
		},
	],
};

export const contactContent: TrustPageContent = {
	title: "Contact Muhammed Saeed",
	description:
		"How to contact Muhammed Saeed about React Native, mobile engineering, writing, and technical collaboration.",
	intro: [
		"Email is the most direct way to contact me. Write to stringsaeed@gmail.com about React Native work, mobile architecture, performance investigations, product engineering, open-source collaboration, or a correction to something I have published. There is no contact form on this site, so your message goes through your email provider and mine rather than through a site database.",
	],
	sections: [
		{
			title: "What to include",
			paragraphs: [
				"A useful first message explains what you are building, the problem you want help with, the expected scope, and any timing or location constraints. For a role, include the team, product, employment type, interview process, and compensation range when available. For a technical question, link to a public reproduction or repository if you can share one safely.",
				"Do not send passwords, API keys, private customer data, or confidential source code by email. If a conversation later needs sensitive material, we can agree on an appropriate channel and access boundary first.",
			],
		},
		{
			title: "Public profiles",
			paragraphs: [
				"GitHub is the best place to inspect public code and open-source activity. LinkedIn has my work history and professional updates. I also post shorter notes on X and Bluesky. Profiles linked from this site use the Stringsaeed handle so you can distinguish them from other people named Saeed.",
			],
		},
	],
};

export const privacyContent: TrustPageContent = {
	title: "Privacy",
	description:
		"Privacy information for thisissaeed.com, including analytics, performance measurement, email, and external links.",
	intro: [
		"This is a personal portfolio and writing archive. It does not provide user accounts, comments, payments, advertising, or a contact form. I do not ask you to enter personal information on the site. This notice describes the limited measurement used to maintain the site and what happens when you follow a link or contact me elsewhere.",
	],
	sections: [
		{
			title: "Analytics and performance",
			paragraphs: [
				"The site uses Vercel Web Analytics to count page views and selected navigation events. Vercel describes this analytics data as anonymized and cookie-free. Reports can include the page, referrer, country, browser, operating system, and device category. A daily rotating hash is used to estimate unique visitors, and Vercel says it cannot track that visitor across different days or websites.",
				"Vercel Speed Insights measures real-world performance such as loading speed, responsiveness, and visual stability. A data point can include the route, device type, browser, operating system, country, network speed, and a Web Vital measurement. Vercel states that these measurements are not associated with an individual visitor or IP address and cannot reconstruct a browsing session across pages.",
			],
		},
		{
			title: "Email and external services",
			paragraphs: [
				"If you email me, your message and address are handled by the email services used by you and by me. I use that information to read and respond to the conversation. Links to GitHub, LinkedIn, X, Bluesky, employers, articles, and other websites leave this site. Those services have their own privacy terms and may collect information under their own policies.",
			],
		},
		{
			title: "Questions and changes",
			paragraphs: [
				"For a privacy question about this site, email stringsaeed@gmail.com. I may update this notice when the site starts or stops using a service, or when the way a service processes site data changes. The current version was last updated on August 30, 2026.",
			],
		},
	],
};

export const trustPages = {
	about: aboutContent,
	contact: contactContent,
	privacy: privacyContent,
} as const;
