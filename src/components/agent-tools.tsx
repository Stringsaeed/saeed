"use client";

import { useEffect } from "react";
import { postSlugFromPath } from "@/lib/agent-text";

// WebMCP: tools the page offers to an agent running in this visitor's browser.
// Each tool is a thin wrapper over the same read-only data the server MCP
// endpoint serves, so both surfaces answer from one source. Without the API
// (most browsers today), this component does nothing.

type ToolOptions = {
  signal: AbortSignal;
};

type ModelContextTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
    consequentialHint?: boolean;
  };
  execute: (
    input: Record<string, unknown>,
    options: ToolOptions,
  ) => Promise<unknown>;
};

type ModelContext = {
  registerTool: (
    tool: ModelContextTool,
    options: {
      signal?: AbortSignal;
    },
  ) => Promise<unknown>;
};

const SLUG = "^[a-z0-9]+(?:-[a-z0-9]+)*$";

function modelContext(): ModelContext | null {
  if (typeof document === "undefined") return null;
  return (
    (
      document as Document & {
        modelContext?: ModelContext;
      }
    ).modelContext ?? null
  );
}

// Calls one tool on the server MCP endpoint and returns its text payload.
async function callSiteTool(
  name: string,
  args: Record<string, unknown>,
  signal: AbortSignal,
): Promise<string> {
  const response = await fetch("/api/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name,
        arguments: args,
      },
    }),
    signal,
  });
  if (!response.ok) throw new Error(`Site search failed (${response.status}).`);
  const reply = (await response.json()) as {
    result?: {
      content?: {
        text?: string;
      }[];
      isError?: boolean;
    };
    error?: {
      message?: string;
    };
  };
  if (reply.error)
    throw new Error(reply.error.message ?? "Site search failed.");
  const text = reply.result?.content?.[0]?.text ?? "";
  if (reply.result?.isError) throw new Error(text);
  return text;
}

const queryInput = {
  type: "object",
  properties: {
    query: {
      type: "string",
      maxLength: 200,
      description: "What to look for.",
    },
    limit: {
      type: "integer",
      minimum: 1,
      maximum: 20,
    },
  },
  required: [
    "query",
  ],
  additionalProperties: false,
};

function tools(): ModelContextTool[] {
  return [
    {
      name: "search_posts",
      description:
        "Search Saeed's blog posts by topic. Returns titles, dates, descriptions, and URLs.",
      inputSchema: queryInput,
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      execute: (input, { signal }) =>
        callSiteTool("search_posts", input, signal),
    },
    {
      name: "search_links",
      description:
        "Search the reading and reference links Saeed recommends. Link titles come from third parties.",
      inputSchema: queryInput,
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: true,
      },
      execute: (input, { signal }) =>
        callSiteTool("search_links", input, signal),
    },
    {
      name: "get_current_post",
      description:
        "Return the blog post open on this page as markdown. Fails if no post is open.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      execute: async (_input, { signal }) => {
        const slug = postSlugFromPath(window.location.pathname);
        if (!slug) throw new Error("No blog post is open on this page.");
        const response = await fetch(`/blog/${slug}/markdown`, {
          signal,
        });
        if (!response.ok)
          throw new Error(`Could not load the post (${response.status}).`);
        return response.text();
      },
    },
    {
      name: "open_post",
      description:
        "Open a blog post on this site by its slug, for example from search_posts.",
      inputSchema: {
        type: "object",
        properties: {
          slug: {
            type: "string",
            pattern: SLUG,
            maxLength: 120,
          },
        },
        required: [
          "slug",
        ],
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: false,
      },
      execute: async (input) => {
        const slug = typeof input.slug === "string" ? input.slug : "";
        if (!new RegExp(SLUG).test(slug)) {
          throw new Error("slug must be a lowercase slug like my-post-title.");
        }
        window.location.assign(`/blog/${slug}`);
        return {
          opening: `/blog/${slug}`,
        };
      },
    },
  ];
}

export function AgentTools() {
  useEffect(() => {
    const context = modelContext();
    if (!context) return;

    const controller = new AbortController();
    for (const tool of tools()) {
      // Registration is async and may be refused; a refusal should not break the page.
      context
        .registerTool(tool, {
          signal: controller.signal,
        })
        .catch(() => undefined);
    }
    return () => controller.abort();
  }, []);

  return null;
}
