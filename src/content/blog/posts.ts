export type BlogPost = {
	slug: string;
	title: string;
	description: string;
	date: string;
	tags: readonly string[];
};

export const posts: readonly BlogPost[] = [
	{
		slug: "every-team-needs-a-gardener",
		title: "Every Team Needs a Gardener",
		description:
			"Anyone can write code with an agent. The engineer still builds the foundations and keeps the garden tidy.",
		date: "2026-09-01T12:00:00.000Z",
		tags: [
			"AI",
			"Agents",
			"Engineering",
		],
	},
	{
		slug: "best-ai-workflow-is-nothing-new",
		title: "The Best AI Workflow Is Nothing New",
		description:
			"The strongest agent workflows copy the roles, handoffs, and quality gates that made good software teams effective long before AI.",
		date: "2026-08-28T12:00:00.000Z",
		tags: [
			"AI",
			"Agents",
			"Workflow",
		],
	},
	{
		slug: "ai-implementation-bottleneck",
		title: "AI Made Implementation Faster. What About Everything Else?",
		description:
			"Faster coding does not make software delivery faster when planning, review, QA, approvals, and releases still move at the old pace.",
		date: "2026-08-27T18:06:45.137Z",
		tags: [
			"AI",
			"Engineering",
			"Workflow",
		],
	},
	{
		slug: "software-engineering-future",
		title: "Software Engineering's Future Has Never Felt This Vague",
		description:
			"AI has brought back engineers' drive to learn, but keeping up should not come at the cost of a life outside technology.",
		date: "2026-08-27T14:32:13.619Z",
		tags: [
			"AI",
			"Engineering",
			"Career",
		],
	},
	{
		slug: "skills-for-ai-assisted-engineering",
		title: "Three Skills Every AI-Assisted Engineering Workflow Needs",
		description:
			"Verification, clear writing, and restraint make agent-assisted engineering workflows more reliable and easier to maintain.",
		date: "2026-08-25T06:53:20.314Z",
		tags: [
			"AI",
			"Engineering",
			"Developer Tools",
		],
	},
	{
		slug: "ai-model-harness-agent-glossary",
		title:
			"A Simple Glossary for AI Models, Harnesses, Agents, and Frontier Models",
		description:
			"Plain definitions for four AI terms that are easy to mix up: model, harness, agent, and frontier model.",
		date: "2026-08-23T05:17:26.705Z",
		tags: [
			"AI",
			"Agents",
			"Glossary",
		],
	},
	{
		slug: "trying-pi-agent-and-hermes-agent",
		title: "Trying Pi Agent and Hermes Agent",
		description:
			"Early notes on using Pi and Hermes to switch models inside one shared agent session for implementation, review, and planning.",
		date: "2026-08-23T03:47:35.113Z",
		tags: [
			"AI",
			"Agents",
			"Developer Tools",
		],
	},
	{
		slug: "ox-alpha-first-impressions",
		title: "Ox Alpha Feels Too Good to Be True",
		description:
			"First impressions of Ox Alpha, a stealth model with surprising compute and broad free availability through OpenCode and model gateways.",
		date: "2026-08-22T07:18:10.016Z",
		tags: [
			"AI",
			"Models",
			"Developer Tools",
		],
	},
	{
		slug: "senior-engineer-paths-ai-era",
		title: "Three Paths for Senior Engineers in the AI Era",
		description:
			"AI is changing the traditional individual contributor path and making product judgment more valuable for senior engineers.",
		date: "2026-08-22T05:33:47.727Z",
		tags: [
			"AI",
			"Engineering",
			"Career",
		],
	},
	{
		slug: "practical-agentic-development-workflow",
		title: "A Practical Workflow for Agentic Development",
		description:
			"A repeatable agent-assisted workflow that moves from grilling and specification to scoped issues, implementation, and review.",
		date: "2026-08-22T02:43:00.129Z",
		tags: [
			"AI",
			"Agents",
			"Workflow",
		],
	},
	{
		slug: "react-native-underlay-sheet",
		title: "React Native Underlay Sheet UI",
		description:
			"Recreating an underlay sheet animation in React Native with Reanimated, Gesture Handler, Gorhom Bottom Sheet, and real components that ship.",
		date: "2024-03-23T00:00:00.000Z",
		tags: [
			"React Native",
			"Engineering",
		],
	},
	{
		slug: "dark-mode-react-native",
		title: "Dark Mode in React Native",
		description:
			"Building a consistent dark mode in React Native with Context, persistence, and the Appearance API to keep native components in sync.",
		date: "2023-10-14T00:00:00.000Z",
		tags: [
			"React Native",
			"Engineering",
		],
	},
];

export const postLoaders: Record<
	string,
	() => Promise<{
		default: React.ComponentType;
	}>
> = {
	"every-team-needs-a-gardener": () =>
		import("./every-team-needs-a-gardener.mdx"),
	"best-ai-workflow-is-nothing-new": () =>
		import("./best-ai-workflow-is-nothing-new.mdx"),
	"ai-implementation-bottleneck": () =>
		import("./ai-implementation-bottleneck.mdx"),
	"software-engineering-future": () =>
		import("./software-engineering-future.mdx"),
	"skills-for-ai-assisted-engineering": () =>
		import("./skills-for-ai-assisted-engineering.mdx"),
	"ai-model-harness-agent-glossary": () =>
		import("./ai-model-harness-agent-glossary.mdx"),
	"trying-pi-agent-and-hermes-agent": () =>
		import("./trying-pi-agent-and-hermes-agent.mdx"),
	"ox-alpha-first-impressions": () =>
		import("./ox-alpha-first-impressions.mdx"),
	"senior-engineer-paths-ai-era": () =>
		import("./senior-engineer-paths-ai-era.mdx"),
	"practical-agentic-development-workflow": () =>
		import("./practical-agentic-development-workflow.mdx"),
	"react-native-underlay-sheet": () =>
		import("./react-native-underlay-sheet.mdx"),
	"dark-mode-react-native": () => import("./dark-mode-react-native.mdx"),
};

export function getPost(slug: string) {
	return posts.find((post) => post.slug === slug);
}

export function formatPostDate(
	date: string,
	format: "compact" | "full" = "compact",
) {
	return new Intl.DateTimeFormat("en-US", {
		month: format === "full" ? "long" : "short",
		day: format === "full" ? "numeric" : undefined,
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(date));
}
