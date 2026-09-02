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
