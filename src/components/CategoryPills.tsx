"use client";

import Link from "next/link";
import clsx from "clsx";
import type { Category } from "@/lib/types";

const pillClass = (isActive: boolean) =>
  clsx(
    "rounded-full border px-4 py-1.5 text-sm transition",
    isActive
      ? "border-maroon bg-maroon text-white"
      : "border-line text-ink/80 hover:border-maroon hover:text-maroon"
  );

export function CategoryPills({
  categories,
  active,
  onSelect,
}: {
  categories: Category[];
  active?: string;
  // When provided, pills become buttons that call this instead of
  // navigating to a new URL. Used on the main shop-browsing view so
  // switching categories is instant (every product is already loaded on
  // the client) instead of round-tripping to the server -- and from there
  // to Supabase -- on every click. Omit it to fall back to real links
  // (e.g. the search-results view, which already navigates for the search
  // itself, so a normal link is fine there).
  onSelect?: (slug?: string) => void;
}) {
  if (onSelect) {
    return (
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onSelect(undefined)} className={pillClass(!active)}>
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => onSelect(c.slug)}
            className={pillClass(active === c.slug)}
          >
            {c.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/shop" className={pillClass(!active)}>
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/shop?category=${c.slug}`}
          className={pillClass(active === c.slug)}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
