import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { FavoriteButton } from "@/components/FavoriteButton";
import { StarRating } from "@/components/StarRating";
import { formatINR, discountPercent } from "@/lib/format";
import type { Product, RatingSummary } from "@/lib/types";

export function ProductCard({
  product,
  ratingSummary,
}: {
  product: Product;
  // Optional -- pages that already fetch bulk rating summaries (shop, home,
  // related products) pass this in; omitting it just skips the stars
  // rather than triggering a fetch per card.
  ratingSummary?: RatingSummary;
}) {
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock < 4;
  const percentOff = discountPercent(product.price, product.compareAtPrice);

  return (
    // The heart button lives in this outer wrapper rather than inside the
    // <Link> below -- a <button> nested inside an <a> is invalid HTML
    // (interactive content can't nest), which some browsers render
    // unreliably. Keeping it as a sibling avoids that entirely while
    // still sitting visually on top of the cover image.
    <div className="group relative overflow-hidden rounded-md border border-line bg-white/60 transition hover:border-gold hover:shadow-md">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative">
          <ProductImage
            category={product.category}
            name={product.name}
            imageUrl={product.images?.[0]}
            zoomOnHover
          />
          {percentOff !== null && !outOfStock && (
            <span className="absolute left-2 top-2 rounded bg-maroon px-2 py-0.5 text-[12px] font-medium text-white">
              {percentOff}% OFF
            </span>
          )}
          {outOfStock && (
            <span className="absolute left-2 top-2 rounded bg-ink/80 px-2 py-0.5 text-[12px] font-medium text-white">
              Out of stock
            </span>
          )}
        </div>
        <div className="space-y-1 p-3">
          <p className="truncate font-display text-base text-ink">{product.name}</p>
          <p className="text-sm text-ink/80">
            {product.fabric} &middot; {product.color}
          </p>
          {ratingSummary && ratingSummary.count > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating value={ratingSummary.average} size="h-3.5 w-3.5" />
              <span className="text-xs text-ink/60">({ratingSummary.count})</span>
            </div>
          )}
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-1">
            <span className="font-medium text-maroon">{formatINR(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-sm text-ink/70 line-through">
                {formatINR(product.compareAtPrice)}
              </span>
            )}
            {percentOff !== null && (
              <span className="text-sm font-medium text-green-700">{percentOff}% off</span>
            )}
          </div>
          {lowStock && (
            <p className="text-sm font-medium text-maroon">Only {product.stock} left</p>
          )}
        </div>
      </Link>
      <FavoriteButton
        item={{
          productId: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          color: product.color,
          category: product.category,
          image: product.images?.[0],
        }}
      />
    </div>
  );
}
