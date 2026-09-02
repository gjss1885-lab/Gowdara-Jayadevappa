export const siteConfig = {
  name: "Gowdara Jayadevappa",
  shortName: "Gowdara Jayadevappa Silks",
  tagline: "Handpicked sarees, woven with tradition",
  description:
    "Gowdara Jayadevappa — a saree store bringing you Kanjivaram, Banarasi, silk and cotton sarees, handpicked and delivered across India.",
  phone: "+91 08192 296699",
  email: "GJSSDVG@hotmail.com",
  address: "Chowkipet Rd, Mandipet, Davangere, Karnataka 577001",
  instagramUrl: "https://www.instagram.com/gowdarjayadevappasilksarees",
  currency: "INR",
};

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const isSupabaseAdminConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const isRazorpayConfigured = Boolean(
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
);

// Transactional email (order confirmations/status updates, back-in-stock
// alerts) via Resend. See .env.local.example.
export const isEmailConfigured = Boolean(
  process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL
);

// Absolute base URL used for links inside emails (they can't be relative)
// and, as of the SEO pass, for `metadataBase`/the sitemap -- both call
// `new URL(siteUrl)`, which throws on an empty string. Sensible fallback
// chain: an explicitly-set URL, then Vercel's own per-deployment URL, then
// localhost for local dev. Uses `||` rather than `??` deliberately -- Om's
// own `.env.local` is expected to have `NEXT_PUBLIC_SITE_URL=` (blank) for
// local dev, and an empty string needs to fall through just like an unset
// variable would.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

// Where real-time error alert emails go (see src/lib/error-reporting.ts).
// Defaults to the store's own contact inbox so this works with zero extra
// setup; set ERROR_ALERT_EMAIL if Om wants alerts routed somewhere else
// (e.g. a personal inbox instead of the public storefront address).
export const errorAlertEmail = process.env.ERROR_ALERT_EMAIL || siteConfig.email;

// Where admin order-alert emails go (new order placed, customer requests a
// cancellation -- see src/lib/notifications.ts). Same "defaults to the
// store's own inbox, override with an env var" pattern as errorAlertEmail
// above, kept separate so Om can route order alerts and error alerts to
// different inboxes if he ever wants to (e.g. order alerts to a shared
// shop inbox, error alerts to his own personal one).
export const adminOrderEmail = process.env.ADMIN_ORDER_EMAIL || siteConfig.email;

// Comma-separated list of email addresses that should be treated as admins
// automatically when they log in through the normal customer OTP login --
// no separate admin password needed for these. e.g.
// ADMIN_EMAILS=owner@gowdarajayadevappa.in,manager@gowdarajayadevappa.in
export const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

export const razorpayPublicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

export const FREE_SHIPPING_THRESHOLD = 2999;
export const STANDARD_SHIPPING = 99;

// Google Analytics (GA4). The script only loads at all when this is set --
// nothing is fetched from Google, and no cookie is set, until Om adds his
// own measurement ID. See src/components/GoogleAnalytics.tsx.
export const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

// How long a logged-in customer's checkout snapshot sits untouched before
// the abandoned-cart reminder email goes out (see
// src/app/api/cron/abandoned-carts/route.ts and vercel.json).
export const ABANDONED_CART_REMINDER_HOURS = 2;
