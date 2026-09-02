import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { CategoryPills } from "@/components/CategoryPills";
import { listProducts, getCategories, getRatingSummaries } from "@/lib/db";
import { searchProducts } from "@/lib/search";

// Always show the current catalog -- new/edited products shouldn't wait
// for the next deploy to appear here.
export const dynamic = "force-dynamic";

type ShopSearchParams = { category?: string; q?: string };

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}): Promise<Metadata> {
  const { category, q } = await searchParams;
  if (q) {
    // Search-result pages are excluded from indexing (robots.ts already
    // blocks crawling of query strings implicitly via /shop being allowed,
    // but a `noindex` here stops every possible search phrase from being
    // treated as its own indexable page).
    return { title: `Search results for "${q}"`, robots: { index: false } };
  }
  if (category) {
    const categories = await getCategories();
    const active = categories.find((c) => c.slug === category);
    if (active) {
      return {
        title: active.name,
        description: active.description,
        alternates: { canonical: `/shop?category=${active.slug}` },
      };
    }
  }
  return { title: "Shop All Sarees", alternates: { canonical: "/shop" } };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const { category, q } = await searchParams;
  const query = q?.trim().toLowerCase() ?? "";
  const [products, categories] = await Promise.all([listProducts(), getCategories()]);

  const byCategory = category ? products.filter((p) => p.category === category) : products;
  const filtered = query ? searchProducts(byCategory, query) : byCategory;
  const activeCategory = categories.find((c) => c.slug === category);
  const ratingSummaries = await getRatingSummaries(filtered.map((p) => p.id));

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink">
          {query
            ? `Search results for "${q}"`
            : activeCategory
              ? activeCategory.name
              : "Shop All Sarees"}
        </h1>
        {!query && activeCategory && (
          <p className="mt-1 text-sm text-ink/80">{activeCategory.description}</p>
        )}
        {query && (
          <p className="mt-1 text-sm text-ink/80">
            {filtered.length} {filtered.length === 1 ? "saree" : "sarees"} found ·{" "}
            <Link href="/shop" className="text-maroon hover:underline">
              Clear search
            </Link>
          </p>
        )}
      </div>

      <div className="mb-8">
        <CategoryPills categories={categories} active={category} />
      </div>

      {filtered.length === 0 ? (
        <p className="text-ink/80">
          {query
            ? `No sarees found matching "${q}" — try a different search term.`
            : "No sarees found in this collection yet — check back soon."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} ratingSummary={ratingSummaries[p.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
