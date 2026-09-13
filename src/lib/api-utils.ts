import { NextResponse } from "next/server";
import { reportError } from "@/lib/error-reporting";

// Wraps a Route Handler so an unexpected throw (a Supabase query failing
// because a column/table doesn't exist yet, a network hiccup, etc.) always
// comes back as a proper JSON error response instead of an empty 500 body.
//
// Without this, an uncaught error in a handler makes Next.js return a 500
// with no body at all -- and client code that does `await res.json()`
// (every admin form in this app) then crashes with a confusing
// "SyntaxError: ... did not match the expected pattern" instead of showing
// a helpful message. This was a real bug found via live testing: editing a
// product before re-running the latest supabase/schema.sql (which adds the
// `images` column) crashed the whole page instead of explaining why.
export function withApiErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
  // Every route behind /api/admin/* is already gated by the admin session
  // check in proxy.ts, so surfacing the real database error there (with its
  // often-actionable `hint`) is a deliberate UX choice, not an oversight --
  // see the comment above. Routes anyone on the internet can hit without
  // logging in (checkout, reviews, newsletter, search, ...) shouldn't hand
  // back raw Postgres/Supabase/Razorpay error text to an anonymous caller,
  // since that can describe internal schema/table details that are useful
  // for probing the site further. Pass `{ public: true }` on those.
  options: { public?: boolean } = {}
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("API route error:", error);
      // Caught here, so it never reaches Next's own error instrumentation
      // (instrumentation.ts's onRequestError only sees errors that escape
      // uncaught) -- report it directly so a real API failure still
      // triggers an alert instead of silently becoming a clean-looking
      // JSON error response.
      const routeLabel = args[0] instanceof Request ? new URL(args[0].url).pathname : "an API route";
      await reportError(routeLabel, error);

      if (options.public) {
        return NextResponse.json(
          { error: "Something went wrong. Please try again in a moment." },
          { status: 500 }
        );
      }

      const message = error instanceof Error ? error.message : "Something went wrong.";
      // Supabase/Postgres errors often carry the actionable fix in `hint`
      // (e.g. "Could not find the 'images' column...") rather than
      // `message` -- surface it when present so the error is self-explanatory
      // in the admin UI instead of just "something went wrong".
      const hint =
        error && typeof error === "object" && "hint" in error && typeof error.hint === "string"
          ? error.hint
          : null;
      return NextResponse.json(
        { error: `Server error: ${message}${hint ? ` (${hint})` : ""}` },
        { status: 500 }
      );
    }
  };
}
