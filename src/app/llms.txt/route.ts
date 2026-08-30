import { getLlmsText } from "@/lib/agent-content";

export const dynamic = "force-static";

export function GET() {
	return new Response(getLlmsText(), {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
}
