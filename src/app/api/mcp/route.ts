import {
  getAgentLinks,
  getAgentPost,
  getAgentPosts,
  type LinkItem,
  renderPostMarkdown,
} from "@/lib/agent-content";
import { search } from "@/lib/agent-text";
import { getAbsoluteUrl, siteName } from "@/lib/site";

// A read-only MCP server over Streamable HTTP, stateless: every POST is a
// complete JSON-RPC exchange, so no session has to be kept between requests.
// It exposes only public content, so it needs no authentication.

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_VERSION = "1.0.0";
const MAX_BODY_BYTES = 16 * 1024;
const MAX_QUERY_LENGTH = 200;
const MAX_LIMIT = 20;

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 60;
const RATE_TABLE_MAX = 5_000;

// Per-instance, in-memory limit. On serverless it is a best-effort brake on
// a single hot client, not a global quota.
const rateTable = new Map<
  string,
  {
    count: number;
    resetAt: number;
  }
>();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, MCP-Protocol-Version",
  "Access-Control-Expose-Headers": "MCP-Protocol-Version",
};

const tools = [
  {
    name: "search_posts",
    description:
      "Search Saeed's blog posts by topic. Returns titles, dates, descriptions, and URLs.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          maxLength: MAX_QUERY_LENGTH,
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: MAX_LIMIT,
        },
      },
      required: [
        "query",
      ],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  {
    name: "get_post",
    description:
      "Return one blog post as markdown, by its slug from search_posts.",
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
          maxLength: 120,
        },
      },
      required: [
        "slug",
      ],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  {
    name: "search_links",
    description:
      "Search the reading and reference links Saeed recommends (articles, tools, galleries, portfolios).",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          maxLength: MAX_QUERY_LENGTH,
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: MAX_LIMIT,
        },
      },
      required: [
        "query",
      ],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
] as const;

type JsonRpcId = string | number | null;
type JsonRpcRequest = {
  jsonrpc?: unknown;
  id?: JsonRpcId;
  method?: unknown;
  params?: unknown;
};

function rpcError(id: JsonRpcId, code: number, message: string) {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
    },
  };
}

function rpcResult(id: JsonRpcId, result: unknown) {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

function toolText(value: unknown, isError = false) {
  return {
    content: [
      {
        type: "text",
        text:
          typeof value === "string" ? value : JSON.stringify(value, null, 2),
      },
    ],
    ...(isError
      ? {
          isError: true,
        }
      : {}),
  };
}

function readLimit(value: unknown) {
  if (value === undefined) return 10;
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < 1 || value > MAX_LIMIT) return null;
  return value;
}

function readQuery(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_QUERY_LENGTH) return null;
  return trimmed;
}

async function callTool(name: string, args: Record<string, unknown>) {
  if (name === "search_posts") {
    const query = readQuery(args.query);
    const limit = readLimit(args.limit);
    if (!query || limit === null) {
      return toolText(
        "query must be 1-200 characters; limit must be 1-20.",
        true,
      );
    }
    const posts = await getAgentPosts();
    const hits = search(
      posts,
      query,
      (post) => [
        {
          text: post.title,
          weight: 3,
        },
        {
          text: post.description,
          weight: 2,
        },
        {
          text: post.tags.join(" "),
          weight: 2,
        },
      ],
      limit,
    );
    return toolText({
      results: hits.map((post) => ({
        slug: post.slug,
        title: post.title,
        date: post.date.slice(0, 10),
        description: post.description,
        url: getAbsoluteUrl(`/blog/${post.slug}`),
      })),
    });
  }

  if (name === "get_post") {
    const slug = typeof args.slug === "string" ? args.slug : "";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return toolText(
        "slug must be a lowercase slug like my-post-title.",
        true,
      );
    }
    const post = await getAgentPost(slug);
    if (!post) return toolText(`No post with slug "${slug}".`, true);
    return toolText(await renderPostMarkdown(post));
  }

  if (name === "search_links") {
    const query = readQuery(args.query);
    const limit = readLimit(args.limit);
    if (!query || limit === null) {
      return toolText(
        "query must be 1-200 characters; limit must be 1-20.",
        true,
      );
    }
    const links = await getAgentLinks();
    const hits: LinkItem[] = search(
      links,
      query,
      (link) => [
        {
          text: link.title,
          weight: 3,
        },
        {
          text: link.description,
          weight: 2,
        },
        {
          text: link.type,
          weight: 1,
        },
      ],
      limit,
    );
    return toolText({
      results: hits,
    });
  }

  return toolText(`Unknown tool "${name}".`, true);
}

async function handleMessage(message: JsonRpcRequest) {
  if (message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return rpcError(message.id ?? null, -32600, "Invalid JSON-RPC request.");
  }

  const id = message.id;
  const isNotification = id === undefined;
  const params =
    message.params && typeof message.params === "object"
      ? (message.params as Record<string, unknown>)
      : {};

  switch (message.method) {
    case "initialize":
      return rpcResult(id ?? null, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
        serverInfo: {
          name: siteName,
          version: SERVER_VERSION,
        },
        instructions:
          "Read-only access to Saeed's blog posts, side projects, and reading links. Use search_posts, then get_post; use search_links for recommended reading.",
      });
    case "ping":
      return rpcResult(id ?? null, {});
    case "tools/list":
      return rpcResult(id ?? null, {
        tools,
      });
    case "tools/call": {
      if (typeof params.name !== "string") {
        return rpcError(id ?? null, -32602, "tools/call needs a tool name.");
      }
      const args =
        params.arguments && typeof params.arguments === "object"
          ? (params.arguments as Record<string, unknown>)
          : {};
      return rpcResult(id ?? null, await callTool(params.name, args));
    }
    default:
      if (isNotification) return null;
      return rpcError(
        id ?? null,
        -32601,
        `Method not found: ${message.method}`,
      );
  }
}

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "anonymous";
}

function checkRateLimit(request: Request) {
  const now = Date.now();
  const key = clientKey(request);

  if (rateTable.size > RATE_TABLE_MAX) {
    for (const [entryKey, entry] of rateTable) {
      if (entry.resetAt <= now) rateTable.delete(entryKey);
    }
  }

  const entry = rateTable.get(key);
  if (!entry || entry.resetAt <= now) {
    rateTable.set(key, {
      count: 1,
      resetAt: now + RATE_WINDOW_MS,
    });
    return null;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT) {
    return Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  }
  return null;
}

function json(body: unknown, init: ResponseInit = {}) {
  return Response.json(body, {
    ...init,
    headers: {
      ...corsHeaders,
      "MCP-Protocol-Version": PROTOCOL_VERSION,
      ...init.headers,
    },
  });
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export function GET() {
  return new Response(null, {
    status: 405,
    headers: {
      ...corsHeaders,
      Allow: "POST, OPTIONS",
    },
  });
}

export async function POST(request: Request) {
  const retryAfter = checkRateLimit(request);
  if (retryAfter !== null) {
    return json(
      rpcError(null, -32029, "Rate limit exceeded. Try again shortly."),
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
        },
      },
    );
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return json(rpcError(null, -32600, "Request body too large."), {
      status: 413,
    });
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return json(rpcError(null, -32600, "Request body too large."), {
      status: 413,
    });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json(rpcError(null, -32700, "Parse error."), {
      status: 400,
    });
  }

  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return json(rpcError(null, -32600, "Empty batch."), {
        status: 400,
      });
    }
    const replies = (
      await Promise.all(
        payload.map((message) => handleMessage(message as JsonRpcRequest)),
      )
    ).filter((reply) => reply !== null);
    if (replies.length === 0)
      return new Response(null, {
        status: 202,
        headers: corsHeaders,
      });
    return json(replies);
  }

  if (!payload || typeof payload !== "object") {
    return json(rpcError(null, -32600, "Invalid JSON-RPC request."), {
      status: 400,
    });
  }

  const reply = await handleMessage(payload as JsonRpcRequest);
  if (reply === null)
    return new Response(null, {
      status: 202,
      headers: corsHeaders,
    });
  return json(reply);
}
