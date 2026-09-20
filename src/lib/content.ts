import "server-only";
import { cache } from "react";
import { type LinkEntry, links as localLinks } from "@/data/links";
import { isHttpsUrl } from "@/lib/https-url";
import {
  type BlogPost,
  type BlogPostContent,
  readLocalPosts,
} from "@/lib/local-posts";
import type { ContentBlock } from "@/lib/markdown-to-portable-text";
import { sanityFetch } from "@/sanity/fetch";

export type { BlogPost, BlogPostContent, LinkEntry };

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const postsQuery = `*[_type == "post" && defined(slug.current)] | order(date desc) {
  title,
  "slug": slug.current,
  description,
  date,
  tags
}`;

const postQuery = `*[_type == "post" && slug.current == $slug][0] {
  title,
  "slug": slug.current,
  description,
  date,
  tags,
  body
}`;

const linksQuery = `*[_type == "link"] | order(order asc) {
  website,
  type,
  url,
  description
}`;

function isBlogPost(value: unknown): value is BlogPost {
  if (!value || typeof value !== "object") return false;
  const post = value as BlogPost;
  return (
    typeof post.slug === "string" &&
    slugPattern.test(post.slug) &&
    typeof post.title === "string" &&
    post.title.trim() !== "" &&
    typeof post.description === "string" &&
    typeof post.date === "string" &&
    !Number.isNaN(Date.parse(post.date)) &&
    Array.isArray(post.tags) &&
    post.tags.length > 0 &&
    post.tags.every((tag) => typeof tag === "string" && tag.trim() !== "")
  );
}

function isLinkEntry(value: unknown): value is LinkEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as LinkEntry;
  return (
    typeof entry.website === "string" &&
    entry.website.trim() !== "" &&
    typeof entry.type === "string" &&
    entry.type.trim() !== "" &&
    typeof entry.description === "string" &&
    typeof entry.url === "string" &&
    isHttpsUrl(entry.url)
  );
}

function isBody(value: unknown): value is ContentBlock[] {
  return (
    Array.isArray(value) &&
    value.every((block) => {
      return (
        Boolean(block) &&
        typeof block === "object" &&
        typeof block._type === "string"
      );
    })
  );
}

const fetchSanityPosts = cache(async () => {
  const result = await sanityFetch<unknown[]>({
    query: postsQuery,
    tags: [
      "posts",
    ],
  });
  if (!result) return null;
  return result.filter(isBlogPost);
});

const fetchSanityPost = cache(async (slug: string) => {
  const result = await sanityFetch<unknown>({
    query: postQuery,
    params: {
      slug,
    },
    tags: [
      "posts",
      `post:${slug}`,
    ],
  });
  if (!isBlogPost(result)) return null;
  const record = result as BlogPost & {
    body?: unknown;
  };
  const body = isBody(record.body) ? record.body : [];
  return {
    ...record,
    body,
  };
});

const fetchSanityLinks = cache(async () => {
  const result = await sanityFetch<unknown[]>({
    query: linksQuery,
    tags: [
      "links",
    ],
  });
  if (!result) return null;
  return result.filter(isLinkEntry);
});

export const getPosts = cache(async (): Promise<readonly BlogPost[]> => {
  const remote = await fetchSanityPosts();
  if (remote && remote.length > 0) return remote;
  return readLocalPosts().map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.date,
    tags: post.tags,
  }));
});

export const getPost = cache(
  async (slug: string): Promise<BlogPostContent | null> => {
    const remotePosts = await fetchSanityPosts();
    if (remotePosts && remotePosts.length > 0) {
      if (!remotePosts.some((post) => post.slug === slug)) return null;
      return fetchSanityPost(slug);
    }

    return readLocalPosts().find((post) => post.slug === slug) ?? null;
  },
);

export const getLinks = cache(async (): Promise<readonly LinkEntry[]> => {
  const remote = await fetchSanityLinks();
  if (remote && remote.length > 0) return remote;
  return localLinks;
});

export function formatPostDate(
  date: string,
  format: "compact" | "full" = "compact",
) {
  return new Intl.DateTimeFormat("en-US", {
    month: format === "full" ? "long" : "short",
    day: format === "full" ? "numeric" : undefined,
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}
