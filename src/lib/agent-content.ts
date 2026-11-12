import "server-only";
import { getLinks, getPost, getPosts } from "@/lib/content";
import type { BlogPost, BlogPostContent } from "@/lib/local-posts";
import { shippedApps, sideProjects } from "@/data/projects";
import { portableTextToMarkdown } from "@/lib/agent-text";
import { getAbsoluteUrl } from "@/lib/site";

// Everything an agent can read or search comes from here, so the MCP tools,
// llms.txt, and the markdown routes cannot disagree about what the site says.

export const postMarkdownPath = (slug: string) => `/blog/${slug}/markdown`;

export type LinkItem = {
  title: string;
  url: string;
  type: string;
  description: string;
};

export type ProjectItem = {
  name: string;
  description: string;
  url: string;
};

export async function getAgentPosts(): Promise<readonly BlogPost[]> {
  return getPosts();
}

export async function getAgentLinks(): Promise<readonly LinkItem[]> {
  const links = await getLinks();
  return links.map((link) => ({
    title: link.website,
    url: link.url,
    type: link.type,
    description: link.description,
  }));
}

export function getAgentProjects(): readonly ProjectItem[] {
  const side = sideProjects.map((project) => ({
    name: project.name,
    description: project.description,
    url: project.href,
  }));
  const shipped = shippedApps.map((app) => ({
    name: app.name,
    description: app.description,
    url: app.web ?? app.appStore,
  }));
  return [
    ...side,
    ...shipped,
  ];
}

export async function getAgentPost(
  slug: string,
): Promise<BlogPostContent | null> {
  return getPost(slug);
}

export async function renderPostMarkdown(post: BlogPostContent) {
  const url = getAbsoluteUrl(`/blog/${post.slug}`);
  const body = portableTextToMarkdown(post.body);
  return [
    `# ${post.title}`,
    "",
    `${post.description}`,
    "",
    `Published ${post.date.slice(0, 10)} · ${url}`,
    "",
    body,
    "",
  ].join("\n");
}
