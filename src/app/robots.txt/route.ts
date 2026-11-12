import { getAbsoluteUrl } from "@/lib/site";

// Replaces robots.ts: Next's Robots type cannot emit the ARD Agentmap line.
export function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${getAbsoluteUrl("/sitemap.xml")}`,
    `Agentmap: ${getAbsoluteUrl("/.well-known/ard.json")}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
