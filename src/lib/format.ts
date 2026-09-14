export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Returns the whole-number percentage a product is discounted by, or null
// when there's nothing to show (no compareAtPrice, or it isn't actually
// higher than the selling price -- e.g. a stale/mis-entered value). Rounded
// down so the badge never overstates the saving.
export function discountPercent(price: number, compareAtPrice?: number | null): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.floor(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// JSON.stringify does NOT escape "<" -- fine for a JSON API response, but
// dangerous inside an inlined <script> tag: a product name/description
// containing the literal text "</script>" would close the script element
// early and let whatever HTML follows it in the string run as markup (and,
// since this site's CSP allows inline scripts for Google Analytics, an
// injected <script> tag right after it would actually execute). Escaping
// "<" as its unicode form defuses that while staying valid, identical JSON
// once the browser parses it. Use this instead of a bare JSON.stringify
// for anything going into dangerouslySetInnerHTML.
export function safeJsonLdStringify(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
