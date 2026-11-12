import {
  getAgentPost,
  getAgentPosts,
  renderPostMarkdown,
} from "@/lib/agent-content";
import { siteName } from "@/lib/site";

// Every post in one file, in the same markdown the per-post routes serve.
export async function GET() {
  const posts = await getAgentPosts();
  const bodies = await Promise.all(
    posts.map(async (post) => {
      const full = await getAgentPost(post.slug);
      return full ? renderPostMarkdown(full) : "";
    }),
  );

  const text = [
    `# ${siteName}: full text`,
    "",
    ...bodies.filter(Boolean),
  ].join("\n\n---\n\n");
  return new Response(`${text}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
