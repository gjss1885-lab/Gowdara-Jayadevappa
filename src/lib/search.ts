import type { Product } from "@/lib/types";

// Shared substring match used by both the shop page's filtering and the
// header search's live suggestions, so "does this saree match this query"
// means exactly the same thing in both places.
export function matchesQuery(product: Product, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [product.name, product.fabric, product.color, product.description]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function searchProducts(products: Product[], query: string): Product[] {
  return products.filter((p) => matchesQuery(p, query));
}
