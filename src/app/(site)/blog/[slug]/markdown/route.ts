import {
  getAgentPost,
  getAgentPosts,
  renderPostMarkdown,
} from "@/lib/agent-content";

export async function generateStaticParams() {
  const posts = await getAgentPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      slug: string;
    }>;
  },
) {
  const { slug } = await params;
  const post = await getAgentPost(slug);
  if (!post)
    return new Response("Not found", {
      status: 404,
    });

  return new Response(await renderPostMarkdown(post), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
