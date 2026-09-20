import { makeRouteHandler } from "@keystatic/next/route-handler";
import { missingKeystaticGithubEnv } from "@/lib/keystatic-github-env";
import config from "../../../../../keystatic.config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const localHandlers =
  process.env.NODE_ENV === "development" && config.storage.kind === "local"
    ? makeRouteHandler({
        config,
      })
    : null;

let githubHandlers: ReturnType<typeof makeRouteHandler> | undefined;

function productionHandlers() {
  if (missingKeystaticGithubEnv().length > 0) return null;
  githubHandlers ??= makeRouteHandler({
    config,
  });
  return githubHandlers;
}

function unavailable(missing: readonly string[]) {
  return new Response(
    `Keystatic GitHub auth is not configured.\n${missing
      .map((key) => `- ${key}`)
      .join("\n")}`,
    {
      status: 503,
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    },
  );
}

async function handle(request: Request) {
  if (localHandlers) {
    return request.method === "POST"
      ? localHandlers.POST(request)
      : localHandlers.GET(request);
  }

  const missing = missingKeystaticGithubEnv();
  if (missing.length > 0) return unavailable(missing);

  const handlers = productionHandlers();
  if (!handlers) return unavailable(missingKeystaticGithubEnv());

  return request.method === "POST"
    ? handlers.POST(request)
    : handlers.GET(request);
}

export const GET = handle;
export const POST = handle;
