"use client";

import { Heart } from "lucide-react";
import { useFavorites, type FavoriteItem } from "@/lib/favorites-context";

// A heart toggle used two ways: as a small overlay on ProductCard, and as a
// standalone button next to "Add to Cart" on the product detail page. Both
// just need enough product data to render the /favorites list later.
export function FavoriteButton({
  item,
  variant = "overlay",
}: {
  item: FavoriteItem;
  variant?: "overlay" | "inline";
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(item.productId);

  function handleClick(e: React.MouseEvent) {
    // The overlay variant sits right next to (not inside) the card's link
    // to the product page -- stop the click from bubbling so it doesn't
    // trigger anything else on the card.
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(item);
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={active ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={active}
        className={`flex items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-semibold transition ${
          active
            ? "border-maroon bg-maroon-light/20 text-maroon"
            : "border-line text-ink/80 hover:border-maroon hover:text-maroon"
        }`}
      >
        <Heart className="h-4 w-4" strokeWidth={1.75} fill={active ? "currentColor" : "none"} />
        {active ? "Favorited" : "Favorite"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={active}
      className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 shadow-sm transition hover:text-maroon ${
        active ? "text-maroon" : "text-ink/80"
      }`}
    >
      <Heart className="h-4 w-4" strokeWidth={1.75} fill={active ? "currentColor" : "none"} />
    </button>
  );
}
