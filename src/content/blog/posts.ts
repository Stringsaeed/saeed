import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import "server-only";
import { postDatePattern } from "@/lib/content-patterns";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: readonly string[];
};

const blogDirectory = path.join(process.cwd(), "src/content/blog");
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const importExportPattern = /(?:^|\n)[ \t]*(?:import|export)\b/;
const forbiddenTagPattern = /<\/?(?:script|iframe|object|embed)\b/i;

function assertTrustedMdx(slug: string, source: string) {
  const withoutFrontmatter = source.replace(/^---\r?\n[\s\S]*?\r?\n---/, "");
  const prose = withoutFrontmatter.replace(/```[\s\S]*?```/g, "");

  if (importExportPattern.test(prose) || forbiddenTagPattern.test(prose)) {
    throw new Error(
      `Blog post "${slug}" must not contain imports, exports, or unregistered HTML. Add a component in code instead.`,
    );
  }
}

function readString(slug: string, field: string, value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Blog post "${slug}" is missing ${field}.`);
  }

  return value;
}

function readDate(slug: string, value: unknown) {
  const date = value instanceof Date ? value.toISOString() : value;
  if (typeof date !== "string" || !postDatePattern.test(date)) {
    throw new Error(
      `Blog post "${slug}" date must be a UTC timestamp like 2026-09-01T12:00:00.000Z.`,
    );
  }

  if (Number.isNaN(Date.parse(date))) {
    throw new Error(`Blog post "${slug}" has an invalid date.`);
  }

  return date;
}

function readTags(slug: string, value: unknown) {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((tag) => typeof tag !== "string" || tag.trim() === "")
  ) {
    throw new Error(`Blog post "${slug}" needs at least one tag.`);
  }

  return value;
}

function readPosts(): readonly BlogPost[] {
  const posts = fs
    .readdirSync(blogDirectory)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const slug = file.slice(0, -".mdx".length);
      if (!slugPattern.test(slug)) {
        throw new Error(`Blog post filename "${file}" is not a valid slug.`);
      }

      const source = fs.readFileSync(path.join(blogDirectory, file), "utf8");
      assertTrustedMdx(slug, source);
      const { data } = matter(source);

      return {
        slug,
        title: readString(slug, "title", data.title),
        description: readString(slug, "description", data.description),
        date: readDate(slug, data.date),
        tags: readTags(slug, data.tags),
      };
    });

  return posts.sort((left, right) => {
    const byDate = right.date.localeCompare(left.date);
    return byDate === 0 ? left.slug.localeCompare(right.slug) : byDate;
  });
}

export const posts = readPosts();

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}

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
