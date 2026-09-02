"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatINR } from "@/lib/format";
import { ProductImage } from "@/components/ProductImage";
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING } from "@/lib/config";

export default function CartPage() {
  const { lines, updateQuantity, removeItem, subtotal, isHydrated } = useCart();

  if (isHydrated && lines.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Your cart is empty</h1>
        <p className="mt-2 text-ink/80">Add a few sarees you love and they’ll show up here.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-md bg-maroon px-6 py-3 text-sm font-semibold text-white hover:bg-maroon-dark"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : STANDARD_SHIPPING;
  const total = subtotal + shipping;

  return (
    <div className="container-page py-10">
      <h1 className="mb-6 font-display text-3xl text-ink">Your Cart</h1>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {lines.map((line) => (
            <div
              key={line.productId}
              className="flex gap-4 rounded-md border border-line bg-white/50 p-3"
            >
              <div className="w-20 shrink-0">
                <ProductImage
                  category={line.category}
                  name={line.name}
                  imageUrl={line.image}
                  hideLabel
                />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link
                    href={`/product/${line.slug}`}
                    className="font-medium text-ink hover:text-maroon"
                  >
                    {line.name}
                  </Link>
                  <p className="text-sm text-ink/80">{line.color}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-md border border-line">
                    <button
                      onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                      className="p-1.5 text-ink/80 hover:text-maroon"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-7 text-center text-sm">{line.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(
                          line.productId,
                          line.stock != null ? Math.min(line.quantity + 1, line.stock) : line.quantity + 1
                        )
                      }
                      disabled={line.stock != null && line.quantity >= line.stock}
                      className="p-1.5 text-ink/80 hover:text-maroon disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-maroon">
                      {formatINR(line.price * line.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(line.productId)}
                      className="text-ink/70 hover:text-maroon"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {line.stock != null && line.quantity >= line.stock && (
                  <p className="text-sm text-ink/70">Only {line.stock} in stock &mdash; that&rsquo;s the most you can order.</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit space-y-4 rounded-md border border-line bg-white/50 p-5">
          <h2 className="font-display text-lg text-ink">Order Summary</h2>
          <div className="space-y-2 text-sm text-ink/80">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
            </div>
          </div>
          <div className="flex justify-between border-t border-line pt-3 font-semibold text-ink">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
          <Link
            href="/checkout"
            className="block rounded-md bg-maroon px-6 py-3 text-center text-sm font-semibold text-white hover:bg-maroon-dark"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
