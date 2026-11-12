import { getAbsoluteUrl, siteDescription } from "@/lib/site";

// MCP Server Card (SEP-2127). Recommended location is <streamable-http-url>/server-card.
// Public, read-only metadata, so CORS is open and the card is cacheable.

export function GET() {
  const card = {
    $schema:
      "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
    name: "com.thisissaeed/site",
    version: "1.0.0",
    description:
      "Read-only search over Saeed's posts, projects, and reading links.",
    title: "Saeed's site",
    websiteUrl: getAbsoluteUrl(),
    remotes: [
      {
        type: "streamable-http",
        url: getAbsoluteUrl("/api/mcp"),
        supportedProtocolVersions: [
          "2025-06-18",
        ],
      },
    ],
    _meta: {
      summary: siteDescription,
    },
  };

  return Response.json(card, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
