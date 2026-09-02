"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Heart, Menu, User } from "lucide-react";
import { useFavorites } from "@/lib/favorites-context";

// Phones-only: folds the Account and Favorites links (each their own icon
// on tablet/desktop) into a single menu button, freeing up header width so
// the store name doesn't have to truncate as aggressively. Cart stays out
// of this menu -- it's the one icon people expect instant access to.
export function MoreMenu() {
  const { count } = useFavorites();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account and favorites menu"
        aria-expanded={open}
        className="relative rounded-md p-1.5 text-ink hover:text-maroon"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-maroon px-1 text-[10px] font-semibold text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-md border border-line bg-cream shadow-lg">
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink hover:bg-cream-dark"
          >
            <User className="h-4 w-4" strokeWidth={1.75} />
            Account
          </Link>
          <Link
            href="/favorites"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between gap-2.5 px-3 py-2.5 text-sm text-ink hover:bg-cream-dark"
          >
            <span className="flex items-center gap-2.5">
              <Heart className="h-4 w-4" strokeWidth={1.75} />
              Favorites
            </span>
            {count > 0 && <span className="text-sm text-ink/70">{count}</span>}
          </Link>
        </div>
      )}
    </div>
  );
}
