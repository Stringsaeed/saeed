import {
	getMarkdownForPath,
	getMarkdownSibling,
	getNotFoundMarkdown,
} from "@/lib/agent-content";
import { getAbsoluteUrl } from "@/lib/site";

type MarkdownRouteProps = {
	params: Promise<{
		path?: string[];
	}>;
};

export async function GET(request: Request, { params }: MarkdownRouteProps) {
	const { path = [] } = await params;
	const pathname = path.length === 0 ? "/" : `/${path.join("/")}`;
	const markdown = await getMarkdownForPath(pathname);
	const isSibling = request.headers.get("x-markdown-sibling") === "1";
	const link = isSibling
		? `<${getAbsoluteUrl(pathname)}>; rel="canonical"; type="text/html"`
		: `<${getAbsoluteUrl(getMarkdownSibling(pathname))}>; rel="alternate"; type="text/markdown"`;

	return new Response(markdown ?? getNotFoundMarkdown(pathname), {
		status: markdown === null ? 404 : 200,
		headers: {
			"Cache-Control": "public, s-maxage=60, stale-while-revalidate=86400",
			"Content-Type": "text/markdown; charset=utf-8",
			Link: link,
			Vary: "Accept",
		},
	});
}
