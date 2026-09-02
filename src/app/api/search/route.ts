import { NextResponse } from "next/server";
import { listProducts } from "@/lib/db";
import { searchProducts } from "@/lib/search";
import { withApiErrorHandling } from "@/lib/api-utils";

// Backs the header search's live-suggestions dropdown. Kept intentionally
// tiny (a handful of matches, a handful of fields) since it fires on every
// few keystrokes rather than once per page load like /shop does.
const MAX_RESULTS = 6;

export const GET = withApiErrorHandling(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const products = await listProducts();
  const results = searchProducts(products, q)
    .slice(0, MAX_RESULTS)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      category: p.category,
      image: p.images?.[0] ?? null,
    }));

  return NextResponse.json({ results });
});
