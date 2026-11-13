import { getAbsoluteUrl, getSiteOrigin } from "@/lib/site";

// Agentic Resource Discovery manifest. A route, not a file in public/, so a
// deployment that sets NEXT_PUBLIC_SITE_URL advertises that origin. The
// origin is fixed at build, same as robots.txt. Agents also find this path
// from the rel="ard" link and the Link header on /.
export const dynamic = "force-static";

export function GET() {
  const host = new URL(getSiteOrigin()).host;
  const manifest = {
    entries: [
      {
        "@context": "https://agenticresourcediscovery.org/context/v1",
        identifier: `urn:air:${host}:server:site`,
        displayName: "Saeed's site search",
        type: "application/mcp-server-card+json",
        url: getAbsoluteUrl("/api/mcp/server-card"),
        capabilities: [
          "search_posts",
          "get_post",
          "search_links",
        ],
        description:
          "Read-only search over Saeed's blog posts, side projects, and reading links.",
        representativeQueries: [
          "find Saeed's posts about React Native performance",
          "what side projects has Saeed built",
          "show the links Saeed recommends about design engineering",
        ],
      },
    ],
  };

  return Response.json(manifest, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
