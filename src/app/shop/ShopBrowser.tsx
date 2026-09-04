"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { CategoryPills } from "@/components/CategoryPills";
import type { Category, Product, RatingSummary } from "@/lib/types";

// Handles the everyday "browse the shop, click a category pill" flow
// entirely on the client. The server hands over every product, category
// and rating summary once on the initial page load; switching categories
// after that just filters the array already in memory instead of asking
// the server (and, behind it, Supabase) for a fresh page render on every
// click -- that server round trip is what made switching categories feel
// like a multi-second reload.
export function ShopBrowser({
  products,
  categories,
  ratingSummaries,
  initialCategory,
}: {
  products: Product[];
  categories: Category[];
  ratingSummaries: Record<string, RatingSummary>;
  initialCategory?: string;
}) {
  const [active, setActive] = useState<string | undefined>(initialCategory);

  const activeCategory = categories.find((c) => c.slug === active);
  const filtered = useMemo(
    () => (active ? products.filter((p) => p.category === active) : products),
    [products, active]
  );

  function selectCategory(slug?: string) {
    setActive(slug);
    // Keep the URL in sync for bookmarking/sharing, but do it with the
    // native History API rather than next/navigation's router -- router
    // navigation would re-trigger this (force-dynamic) page's server
    // fetch, which is exactly the round trip we're avoiding.
    const url = slug ? `/shop?category=${slug}` : "/shop";
    window.history.replaceState(null, "", url);
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink">
          {activeCategory ? activeCategory.name : "Shop All Sarees"}
        </h1>
        {activeCategory && (
          <p className="mt-1 text-sm text-ink/80">{activeCategory.description}</p>
        )}
      </div>

      <div className="mb-8">
        <CategoryPills categories={categories} active={active} onSelect={selectCategory} />
      </div>

      {filtered.length === 0 ? (
        <p className="text-ink/80">No sarees found in this collection yet — check back soon.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} ratingSummary={ratingSummaries[p.id]} />
          ))}
        </div>
      )}
    </>
  );
}
