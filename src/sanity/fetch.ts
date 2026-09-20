import "server-only";
import { apiVersion, dataset, projectId } from "@/sanity/env";

type SanityFetchOptions = {
  query: string;
  params?: Record<string, unknown>;
  tags: string[];
};

export async function sanityFetch<T>({
  query,
  params = {},
  tags,
}: SanityFetchOptions): Promise<T | null> {
  const url = new URL(
    `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`,
  );
  url.searchParams.set("query", query);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(`$${key}`, JSON.stringify(value));
  }

  const headers = new Headers();
  const token = process.env.SANITY_API_TOKEN?.trim();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  try {
    const response = await fetch(url, {
      headers,
      cache: "force-cache",
      next: {
        revalidate: false,
        tags,
      },
    });
    if (!response.ok) return null;
    const json = (await response.json()) as {
      result?: T;
    };
    return json.result ?? null;
  } catch {
    return null;
  }
}
