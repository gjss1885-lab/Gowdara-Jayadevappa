import type { NextConfig } from "next";

// Content-Security-Policy: locked down to the specific third parties this
// site actually loads (Razorpay's checkout widget, Google Analytics/GTM if
// NEXT_PUBLIC_GA_MEASUREMENT_ID is set, Supabase for auth/storage) instead
// of leaving script/connect/frame wide open. 'unsafe-inline' stays in
// script-src because the GA4 bootstrap (see GoogleAnalytics.tsx) is an
// inline <script>, and Next.js has no nonce plumbed through yet to allow it
// more precisely -- this still blocks a random third-party script tag from
// running, just not inline-script-based XSS. Tightening that further later
// (nonce-based CSP) is a reasonable next step, not required for this pass.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://www.google-analytics.com https://www.googletagmanager.com",
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Backs up frame-ancestors above for browsers that predate that CSP
  // directive -- stops the whole site being loaded in someone else's
  // iframe for clickjacking.
  { key: "X-Frame-Options", value: "DENY" },
  // Stops the browser guessing a response's content-type from its bytes
  // (e.g. treating an uploaded "image" as HTML/JS and running it).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak the full URL (which can contain order IDs, search terms,
  // etc.) to third-party destinations a link is clicked through to.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // This site uses none of these browser APIs -- explicitly deny them so
  // an injected/compromised third-party script can't silently request them.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Tells browsers to only ever reach this host over HTTPS, including on
  // the very first visit (once submitted to browsers' preload lists) --
  // Vercel serves HTTPS-only already, this just makes it explicit and
  // covers any stray http:// link.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  images: {
    // Lets next/image optimize (resize/compress/serve modern formats for)
    // product/category/banner/review photos uploaded to Supabase Storage,
    // whatever project this is pointed at -- those URLs always live under
    // <project-ref>.supabase.co. Locally-stored uploads (no Supabase
    // connected) are served from this same app under /api/uploads/*, which
    // is same-origin and needs no entry here.
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
