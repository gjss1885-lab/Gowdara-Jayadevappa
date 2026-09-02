"use client";

import { Suspense, useEffect } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// The Next.js App Router doesn't fire a browser navigation on route
// changes (no full page load), so GA's own automatic page_view tracking
// never sees anything past the very first load -- this fires one manually
// whenever the path or query string changes. Wrapped in Suspense by the
// parent component because useSearchParams requires it in the App Router.
function GoogleAnalyticsPageviews({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    const query = searchParams.toString();
    window.gtag("config", measurementId, { page_path: query ? `${pathname}?${query}` : pathname });
  }, [pathname, searchParams, measurementId]);

  return null;
}

// Loads GA4 and tracks pageviews across client-side navigations. Renders
// nothing at all -- not even a script tag -- when no measurement ID is
// configured, so a store without Google Analytics set up loads nothing
// extra and sets no cookies.
export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  if (!measurementId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsPageviews measurementId={measurementId} />
      </Suspense>
    </>
  );
}
