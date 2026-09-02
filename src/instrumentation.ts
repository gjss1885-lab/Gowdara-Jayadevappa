import type { Instrumentation } from "next";

// Next's own error-instrumentation hook -- catches uncaught errors from
// anywhere the framework itself sees a request fail (Server Component
// rendering, Server Actions, Proxy/middleware, and any Route Handler NOT
// already wrapped in withApiErrorHandling). Route Handlers wrapped in
// withApiErrorHandling catch their own errors and never throw past it, so
// those report from api-utils.ts directly instead -- this hook is the
// catch-all for everything else.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  // Dynamic import rather than a top-level one: this file also runs in
  // the Edge runtime (see next.config's default), and importing
  // server-only/email code at module scope there could pull in Node APIs
  // that don't exist in that runtime. A dynamic import only runs when an
  // error actually happens, and only in whichever runtime hit it.
  const { reportError } = await import("@/lib/error-reporting");
  await reportError(`${request.method} ${request.path} (${context.routeType})`, error);
};
