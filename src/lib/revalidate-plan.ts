const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type RevalidationPlan = {
  tags: string[];
  paths: string[];
};

function readSlug(value: unknown) {
  const slug =
    typeof value === "string"
      ? value
      : value && typeof value === "object" && "current" in value
        ? value.current
        : undefined;
  return typeof slug === "string" && slugPattern.test(slug) ? slug : null;
}

function isDraft(value: { _id?: unknown }) {
  return typeof value._id === "string" && value._id.startsWith("drafts.");
}

export function planRevalidation(payload: unknown): RevalidationPlan | null {
  if (!payload || typeof payload !== "object") return null;
  const document = payload as {
    _id?: unknown;
    _type?: unknown;
    slug?: unknown;
  };
  if (isDraft(document)) return null;

  if (document._type === "link") {
    return {
      tags: [
        "links",
      ],
      paths: [
        "/links",
      ],
    };
  }

  if (document._type !== "post") return null;

  const slug = readSlug(document.slug);
  const tags = [
    "posts",
  ];
  const paths = [
    "/",
    "/blog",
    "/feed.xml",
    "/sitemap.xml",
  ];
  if (slug) {
    tags.push(`post:${slug}`);
    paths.push(`/blog/${slug}`, `/blog/${slug}/opengraph-image`);
  }

  return {
    tags,
    paths,
  };
}
