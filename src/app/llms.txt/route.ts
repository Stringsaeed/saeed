import {
  getAgentLinks,
  getAgentPosts,
  getAgentProjects,
  postMarkdownPath,
} from "@/lib/agent-content";
import { getAbsoluteUrl, siteDescription, siteName } from "@/lib/site";

// llms.txt (llmstxt.org): a short map of the site for language models.
export async function GET() {
  const [posts, links] = await Promise.all([
    getAgentPosts(),
    getAgentLinks(),
  ]);
  const projects = getAgentProjects();

  const lines = [
    `# ${siteName}`,
    "",
    `> ${siteDescription}`,
    "",
    "Blog posts are also available as markdown. The full text of every post is in /llms-full.txt.",
    "",
    "## Blog",
    "",
    ...posts.map(
      (post) =>
        `- [${post.title}](${getAbsoluteUrl(postMarkdownPath(post.slug))}): ${post.description}`,
    ),
    "",
    "## Projects",
    "",
    ...projects.map(
      (project) =>
        `- [${project.name}](${project.url}): ${project.description}`,
    ),
    "",
    "## Reading",
    "",
    ...links.map(
      (link) => `- [${link.title}](${link.url}): ${link.description}`,
    ),
    "",
    "## Agent access",
    "",
    `- [MCP server card](${getAbsoluteUrl("/api/mcp/server-card")}): read-only MCP endpoint at ${getAbsoluteUrl("/api/mcp")} with search_posts, get_post, and search_links.`,
    `- [ARD manifest](${getAbsoluteUrl("/.well-known/ard.json")})`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
