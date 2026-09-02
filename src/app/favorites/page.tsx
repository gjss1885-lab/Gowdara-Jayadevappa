"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useFavorites } from "@/lib/favorites-context";
import { useCart } from "@/lib/cart-context";
import { ProductImage } from "@/components/ProductImage";
import { FavoriteButton } from "@/components/FavoriteButton";
import { formatINR, discountPercent } from "@/lib/format";

export default function FavoritesPage() {
  const { items, isHydrated } = useFavorites();
  const { addItem } = useCart();

  if (isHydrated && items.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <Heart className="mx-auto h-10 w-10 text-ink/20" strokeWidth={1.5} />
        <h1 className="mt-4 font-display text-2xl text-ink">No favorites yet</h1>
        <p className="mt-2 text-ink/80">
          Tap the heart on any saree to save it here for later.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-md bg-maroon px-6 py-3 text-sm font-semibold text-white hover:bg-maroon-dark"
        >
          Browse the Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="mb-6 font-display text-3xl text-ink">Your Favorites</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.productId}
            className="group overflow-hidden rounded-md border border-line bg-white/60"
          >
            <div className="relative">
              <Link href={`/product/${item.slug}`} className="block">
                <ProductImage category={item.category} name={item.name} imageUrl={item.image} zoomOnHover />
              </Link>
              {/* Same heart-toggle pattern as everywhere else on the site --
                  tapping it here removes the item, since it's already
                  favorited. Keeps this page's card the same width-per-card
                  as the shop grid instead of needing a second bottom button
                  that doesn't fit next to "Add" on narrow phones. */}
              <FavoriteButton item={item} />
            </div>
            <div className="space-y-1 p-3">
              <Link
                href={`/product/${item.slug}`}
                className="block truncate font-display text-base text-ink hover:text-maroon"
              >
                {item.name}
              </Link>
              <p className="text-sm text-ink/80">{item.color}</p>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-1">
                <span className="font-medium text-maroon">{formatINR(item.price)}</span>
                {item.compareAtPrice && (
                  <span className="text-sm text-ink/70 line-through">
                    {formatINR(item.compareAtPrice)}
                  </span>
                )}
                {discountPercent(item.price, item.compareAtPrice) !== null && (
                  <span className="text-sm font-medium text-green-700">
                    {discountPercent(item.price, item.compareAtPrice)}% off
                  </span>
                )}
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() =>
                    addItem({
                      productId: item.productId,
                      slug: item.slug,
                      name: item.name,
                      price: item.price,
                      color: item.color,
                      category: item.category,
                      image: item.image,
                    })
                  }
                  aria-label="Add to cart"
                  className="flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-maroon px-3 py-1.5 text-sm font-semibold text-white hover:bg-maroon-dark"
                >
                  <ShoppingBag className="h-3.5 w-3.5 shrink-0" /> Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
