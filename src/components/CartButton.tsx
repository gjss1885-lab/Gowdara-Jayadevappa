"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export function CartButton() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-1.5 rounded-md px-2 py-1.5 text-ink hover:text-maroon"
      aria-label="View cart"
    >
      <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-maroon px-1 text-[11px] font-semibold text-white">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
