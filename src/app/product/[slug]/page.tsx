import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductGallery } from "@/components/ProductGallery";
import { AddToCartButton } from "@/components/AddToCartButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ProductCard } from "@/components/ProductCard";
import { StarRating } from "@/components/StarRating";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewsList } from "@/components/ReviewsList";
import { NotifyBackInStockForm } from "@/components/NotifyBackInStockForm";
import { ShareButtons } from "@/components/ShareButtons";
import { formatINR, discountPercent } from "@/lib/format";
import { getProduct, listProducts, getCategories, listReviews, getRatingSummaries } from "@/lib/db";
import { siteUrl } from "@/lib/config";

// Always show current stock/price/photos -- an edit in the admin panel
// shouldn't wait for the next deploy to show up here.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  const description = product.description.length > 155
    ? `${product.description.slice(0, 155).trimEnd()}…`
    : product.description;
  const image = product.images?.[0];

  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: product.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [allProducts, categories, reviews] = await Promise.all([
    listProducts(),
    getCategories(),
    listReviews(product.id),
  ]);
  const category = categories.find((c) => c.slug === product.category);
  const percentOff = discountPercent(product.price, product.compareAtPrice);

  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  // Prefer other sarees in the same category, but with a small/new catalog
  // there may not be enough of those to fill the row -- top it up with
  // other products rather than hiding the section (or showing just one item)
  // until the catalog grows.
  const others = allProducts.filter((p) => p.id !== product.id);
  const sameCategory = others.filter((p) => p.category === product.category);
  const rest = others.filter((p) => p.category !== product.category);
  const related = [...sameCategory, ...rest].slice(0, 4);
  const relatedRatingSummaries = await getRatingSummaries(related.map((p) => p.id));

  // schema.org Product structured data -- lets Google show price,
  // availability, and a star rating directly in search results instead of
  // a plain blue link. JSON.stringify is safe to inline here (no user text
  // needs escaping the way it would in an HTML attribute) since this is a
  // <script type="application/ld+json"> body, not markup.
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images && product.images.length > 0 ? product.images : undefined,
    sku: product.id,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/product/${product.slug}`,
      priceCurrency: "INR",
      price: product.price,
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(reviews.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: averageRating.toFixed(1),
            reviewCount: reviews.length,
          },
        }
      : {}),
  };

  return (
    <div className="container-page py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <p className="mb-6 text-sm text-ink/70">
        <Link href="/shop" className="hover:text-maroon">
          Shop
        </Link>{" "}
        /{" "}
        <Link href={`/shop?category=${product.category}`} className="hover:text-maroon">
          {category?.name ?? product.category}
        </Link>{" "}
        / <span className="text-ink/80">{product.name}</span>
      </p>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="mx-auto w-full max-w-md">
          <ProductGallery
            images={product.images ?? []}
            category={product.category}
            name={product.name}
          />
        </div>

        <div className="space-y-5">
          <div>
            <h1 className="font-display text-3xl text-ink">{product.name}</h1>
            <p className="mt-1 text-sm text-ink/80">
              {product.fabric} &middot; {product.color}
            </p>
            {reviews.length > 0 && (
              <a href="#reviews" className="mt-2 flex items-center gap-1.5 text-sm">
                <StarRating value={averageRating} size="h-4 w-4" />
                <span className="text-ink/70 hover:text-maroon hover:underline">
                  {averageRating.toFixed(1)} ({reviews.length} review{reviews.length === 1 ? "" : "s"})
                </span>
              </a>
            )}
            <div className="mt-3">
              <ShareButtons
                url={`${siteUrl}/product/${product.slug}`}
                title={product.name}
              />
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-maroon">{formatINR(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-base text-ink/70 line-through">
                {formatINR(product.compareAtPrice)}
              </span>
            )}
            {percentOff !== null && (
              <span className="rounded bg-green-700/10 px-2 py-0.5 text-sm font-medium text-green-700">
                {percentOff}% off
              </span>
            )}
          </div>

          <p className="leading-relaxed text-ink/90">{product.description}</p>

          <p className="text-sm text-ink/80">
            {product.stock > 0
              ? product.stock < 4
                ? `Only ${product.stock} left in stock`
                : "In stock"
              : "Currently out of stock"}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <AddToCartButton product={product} />
            </div>
            <FavoriteButton
              variant="inline"
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

          {product.stock <= 0 && <NotifyBackInStockForm productId={product.id} />}

          <div className="rounded-md border border-line bg-white/50 p-4 text-sm text-ink/80">
            <p>Free shipping on orders above &#8377;2,999. Cash on delivery available.</p>
          </div>
        </div>
      </div>

      <div id="reviews" className="mt-16 max-w-2xl scroll-mt-20">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">Ratings &amp; Reviews</h2>
          {reviews.length > 0 && (
            <span className="flex items-center gap-1.5 text-sm text-ink/70">
              <StarRating value={averageRating} size="h-4 w-4" />
              {averageRating.toFixed(1)} out of 5
            </span>
          )}
        </div>
        <div className="mb-8">
          <ReviewsList reviews={reviews} />
        </div>
        <ReviewForm productId={product.id} />
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl text-ink">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} ratingSummary={relatedRatingSummaries[p.id]} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
