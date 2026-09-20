import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { revalidatePath, revalidateTag } from "next/cache";
import { planRevalidation } from "@/lib/revalidate-plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.SANITY_WEBHOOK_SECRET?.trim();
  const signature = request.headers.get(SIGNATURE_HEADER_NAME);
  const body = await request.text();

  if (
    !secret ||
    !signature ||
    !(await isValidSignature(body, signature, secret))
  ) {
    return new Response(null, {
      status: 401,
    });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response(null, {
      status: 400,
    });
  }

  const plan = planRevalidation(payload);
  if (!plan)
    return new Response(null, {
      status: 204,
    });

  for (const tag of plan.tags) {
    revalidateTag(tag, {
      expire: 0,
    });
  }
  for (const path of plan.paths) {
    revalidatePath(path);
  }

  return Response.json({
    revalidated: true,
  });
}
