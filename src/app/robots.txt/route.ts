import { getAbsoluteUrl } from "@/lib/site";

// Lighthouse's robots.txt audit rejects an Agentmap directive. Keep the
// manifest URL as a comment; agents still find /.well-known/ard.json via
// the well-known path and the rel="ard" link.
export function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${getAbsoluteUrl("/sitemap.xml")}`,
    `# Agentmap: ${getAbsoluteUrl("/.well-known/ard.json")}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
