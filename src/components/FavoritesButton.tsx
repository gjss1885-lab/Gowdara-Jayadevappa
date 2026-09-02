"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites-context";

export function FavoritesButton() {
  const { count } = useFavorites();

  return (
    <Link
      href="/favorites"
      className="relative flex items-center gap-1.5 rounded-md px-2 py-1.5 text-ink hover:text-maroon"
      aria-label="View favorites"
    >
      <Heart className="h-5 w-5" strokeWidth={1.75} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-maroon px-1 text-[11px] font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
