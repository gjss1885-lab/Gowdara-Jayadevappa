import { NextResponse } from "next/server";
import { reportError } from "@/lib/error-reporting";

// Relay endpoint for client-side error reports -- see global-error.tsx.
// That component runs in the browser and can't call the server-only
// reportError() helper directly, so it POSTs the error details here
// instead. Deliberately not wrapped in withApiErrorHandling: if this
// route itself throws, that would try to report an error about failing
// to report an error, which isn't useful and risks a loop.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = typeof body?.message === "string" ? body.message : "Unknown client error";
    const stack = typeof body?.stack === "string" ? body.stack : undefined;
    const digest = typeof body?.digest === "string" ? body.digest : undefined;
    const url = typeof body?.url === "string" ? body.url : "unknown page";

    const error = new Error(message);
    if (stack) error.stack = stack;

    await reportError(`Client-side error on ${url}${digest ? ` (digest ${digest})` : ""}`, error);
  } catch (error) {
    console.error("[api/errors] failed to relay client error report:", error);
  }

  return NextResponse.json({ ok: true });
}
