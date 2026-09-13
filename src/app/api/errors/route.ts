import { NextResponse } from "next/server";
import { reportError } from "@/lib/error-reporting";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// Relay endpoint for client-side error reports -- see global-error.tsx.
// That component runs in the browser and can't call the server-only
// reportError() helper directly, so it POSTs the error details here
// instead. Deliberately not wrapped in withApiErrorHandling: if this
// route itself throws, that would try to report an error about failing
// to report an error, which isn't useful and risks a loop.
export async function POST(request: Request) {
  try {
    // Unauthenticated by necessity (a crashed page has no session to trust),
    // which means anyone can call this directly, not just a real crashed
    // browser -- and each report sends an email. Cap it so that can't turn
    // into an inbox-flooding tool.
    const ip = getClientIp(request);
    if (!rateLimit(`errors:${ip}`, 20, 10 * 60 * 1000)) {
      return NextResponse.json({ ok: true });
    }

    const body = await request.json().catch(() => ({}));
    const message = (typeof body?.message === "string" ? body.message : "Unknown client error").slice(0, 500);
    const stack = (typeof body?.stack === "string" ? body.stack : undefined)?.slice(0, 4000);
    const digest = typeof body?.digest === "string" ? body.digest.slice(0, 200) : undefined;
    const url = (typeof body?.url === "string" ? body.url : "unknown page").slice(0, 500);

    const error = new Error(message);
    if (stack) error.stack = stack;

    await reportError(`Client-side error on ${url}${digest ? ` (digest ${digest})` : ""}`, error);
  } catch (error) {
    console.error("[api/errors] failed to relay client error report:", error);
  }

  return NextResponse.json({ ok: true });
}
