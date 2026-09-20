import { createHash } from "node:crypto";
import { createClient } from "@sanity/client";
import { links } from "../src/data/links";
import { readLocalPosts } from "../src/lib/local-posts";
import { apiVersion, dataset, projectId } from "../src/sanity/env";

const token = process.env.SANITY_API_TOKEN?.trim();
if (!token) {
  console.error("SANITY_API_TOKEN is not set.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
});

const posts = readLocalPosts();

for (const post of posts) {
  await client.createOrReplace({
    _id: `post-${post.slug}`,
    _type: "post",
    title: post.title,
    slug: {
      _type: "slug",
      current: post.slug,
    },
    description: post.description,
    date: post.date,
    tags: [
      ...post.tags,
    ],
    body: post.body,
  });
}

for (const [index, link] of links.entries()) {
  const id = `link-${createHash("sha256").update(link.url).digest("hex").slice(0, 16)}`;
  await client.createOrReplace({
    _id: id,
    _type: "link",
    website: link.website,
    type: link.type,
    url: link.url,
    description: link.description,
    order: index,
  });
}

console.log(
  `Imported ${posts.length} posts and ${links.length} links into ${projectId}/${dataset}.`,
);
