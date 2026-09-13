import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { CategoryPills } from "@/components/CategoryPills";
import { ShopBrowser } from "./ShopBrowser";
import { listProducts, getCategories, getRatingSummaries } from "@/lib/db";
import { searchProducts } from "@/lib/search";

// Reading `searchParams` below means Next.js always renders this page
// per-request rather than serving a cached copy -- that's fine, since it's
// what lets typing a search query or picking a category from a link work
// correctly. What used to make that expensive was listProducts()/
// getCategories() (lib/db.ts) hitting Supabase fresh every single time;
// those now cache for 60s (and clear immediately on an admin edit), so
// this page's per-request render is fast even though the page itself
// isn't cached.
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
  return { title: "Shop All", alternates: { canonical: "/shop" } };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const { category, q } = await searchParams;
  const query = q?.trim().toLowerCase() ?? "";
  const [products, categories] = await Promise.all([listProducts(), getCategories()]);

  // Typing a search query already means a fresh page load (the search box
  // submits a new URL), so a normal server-rendered result list is fine
  // here -- there's no repeated back-and-forth clicking to keep fast.
  if (query) {
    const byCategory = category ? products.filter((p) => p.category === category) : products;
    const filtered = searchProducts(byCategory, query);
    const ratingSummaries = await getRatingSummaries(filtered.map((p) => p.id));

    return (
      <div className="container-page py-10">
        <div className="mb-6">
          <h1 className="font-display text-3xl text-ink">Search results for &quot;{q}&quot;</h1>
          <p className="mt-1 text-sm text-ink/80">
            {filtered.length} {filtered.length === 1 ? "saree" : "sarees"} found ·{" "}
            <Link href="/shop" className="text-maroon hover:underline">
              Clear search
            </Link>
          </p>
        </div>

        <div className="mb-8">
          <CategoryPills categories={categories} active={category} />
        </div>

        {filtered.length === 0 ? (
          <p className="text-ink/80">
            No sarees found matching &quot;{q}&quot; — try a different search term.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} ratingSummary={ratingSummaries[p.id]} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Everyday browsing flow: hand every product, category and rating
  // summary to the client once, then let clicking a category pill filter
  // instantly in the browser instead of reloading from Supabase each time.
  const ratingSummaries = await getRatingSummaries(products.map((p) => p.id));

  return (
    <div className="container-page py-10">
      <ShopBrowser
        products={products}
        categories={categories}
        ratingSummaries={ratingSummaries}
        initialCategory={category}
      />
    </div>
  );
}
