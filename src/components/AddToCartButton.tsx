"use client";

import { useState } from "react";
import { Minus, Plus, Check } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/types";

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock <= 0;

  function handleAdd() {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        color: product.color,
        category: product.category,
        image: product.images?.[0],
        stock: product.stock,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  if (outOfStock) {
    return (
      <button
        disabled
        className="w-full cursor-not-allowed rounded-md bg-ink/20 px-6 py-3 text-sm font-semibold text-ink/70"
      >
        Out of Stock
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-md border border-line">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="p-2 text-ink/80 hover:text-maroon"
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center text-sm font-medium">{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
          className="p-2 text-ink/80 hover:text-maroon"
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className="flex flex-1 items-center justify-center gap-2 rounded-md bg-maroon px-6 py-3 text-sm font-semibold text-white transition hover:bg-maroon-dark"
      >
        {added ? (
          <>
            <Check className="h-4 w-4" /> Added to Cart
          </>
        ) : (
          "Add to Cart"
        )}
      </button>
    </div>
  );
}
