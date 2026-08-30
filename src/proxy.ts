import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
	appendVaryAccept,
	preferredRepresentation,
} from "@/lib/content-negotiation";

const internalPrefixes = [
	"/api/markdown",
	"/_next",
	"/_vercel",
];

function hasFileExtension(pathname: string) {
	return /\/[^/]+\.[^/]+$/.test(pathname);
}

function getContentPath(pathname: string) {
	if (pathname === "/index.md") return "/";
	if (pathname.endsWith(".md")) return pathname.slice(0, -3) || "/";
	return pathname;
}

function getSiblingPath(pathname: string) {
	return pathname === "/" ? "/index.md" : `${pathname}.md`;
}

function addDiscoveryHeaders(response: NextResponse, pathname: string) {
	appendVaryAccept(response.headers);
	response.headers.set(
		"Link",
		`<${getSiblingPath(pathname)}>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"`,
	);
	return response;
}

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	if (
		![
			"GET",
			"HEAD",
		].includes(request.method) ||
		internalPrefixes.some((prefix) => pathname.startsWith(prefix))
	) {
		return NextResponse.next();
	}

	const isMarkdownSibling = pathname.endsWith(".md");
	if (hasFileExtension(pathname) && !isMarkdownSibling) {
		return NextResponse.next();
	}

	const contentPath = getContentPath(pathname);
	const accept = request.headers.get("accept");
	const representation = isMarkdownSibling
		? "text/markdown"
		: preferredRepresentation(accept);

	if (representation === "text/markdown") {
		const url = request.nextUrl.clone();
		url.pathname =
			contentPath === "/" ? "/api/markdown" : `/api/markdown${contentPath}`;
		const requestHeaders = new Headers(request.headers);
		requestHeaders.set("x-markdown-sibling", isMarkdownSibling ? "1" : "0");

		const response = NextResponse.rewrite(url, {
			request: {
				headers: requestHeaders,
			},
		});
		appendVaryAccept(response.headers);
		return response;
	}

	if (representation === null && accept) {
		return new Response(
			"Not Acceptable\n\nAvailable representations: text/html, text/markdown\n",
			{
				status: 406,
				headers: {
					"Content-Type": "text/plain; charset=utf-8",
					Vary: "Accept",
				},
			},
		);
	}

	return addDiscoveryHeaders(NextResponse.next(), contentPath);
}

export const config = {
	matcher: [
		"/((?!_next/|_vercel/).*)",
	],
};
