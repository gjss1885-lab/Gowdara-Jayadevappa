"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

// Catches an error that escapes every other error boundary in the app
// (including the root layout itself). Next.js does NOT include this
// app's global styles/fonts here -- global-error renders its own bare
// <html>/<body>, so the look is hand-styled inline rather than via
// Tailwind classes, which wouldn't be loaded.
//
// Reports the error the same way a server-side failure would (see
// src/lib/error-reporting.ts) via a small API route, since this
// component runs in the browser and can't call server-only code
// directly. Server-side errors are already covered by
// src/instrumentation.ts and api-utils.ts -- this covers the errors that
// only ever happen client-side (e.g. a bug in rendering after the page
// already loaded).
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled client error:", error);
    fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      }),
    }).catch(() => {
      // If even the error-reporting call fails, there's nothing more
      // useful to do from here than what console.error above already did.
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, 'Times New Roman', serif",
          background: "#faf6ee",
          color: "#2a1c17",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ color: "#5c4a3f", marginBottom: 20, lineHeight: 1.5 }}>
            We&rsquo;ve hit a snag loading this page. Please try again — if it keeps happening, it&rsquo;s already been reported.
          </p>
          <button
            onClick={() => retry()}
            style={{
              background: "#7a1f2b",
              color: "#faf6ee",
              border: "none",
              borderRadius: 6,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
