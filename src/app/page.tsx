import Link from "next/link";
import { ArrowRight, Package, ShieldCheck, Truck } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { listProducts, getCategories, getRatingSummaries } from "@/lib/db";
import { siteConfig } from "@/lib/config";

// Without this, Next.js prerenders this page once at build time and bakes
// in whatever products existed then -- new/edited products from the admin
// panel wouldn't show up until the next deploy. Always render fresh.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, categories] = await Promise.all([listProducts(), getCategories()]);
  const featured = products.filter((p) => p.featured).slice(0, 8);
  const displayFeatured = featured.length ? featured : products.slice(0, 8);
  const ratingSummaries = await getRatingSummaries(displayFeatured.map((p) => p.id));

  return (
    <div>
      <section className="relative overflow-hidden bg-maroon text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(216,184,118,0.25),transparent_45%)]" />
        <div className="container-page relative flex flex-col items-start gap-6 py-20 md:py-28">
          <p className="font-display text-sm uppercase tracking-[0.3em] text-gold-light">
            Since generations
          </p>
          <h1 className="max-w-xl font-display text-4xl leading-tight md:text-5xl">
            {siteConfig.tagline}
          </h1>
          <p className="max-w-md text-white/80">{siteConfig.description}</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink transition hover:bg-gold-light"
          >
            Shop the Collection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="temple-border" />
      </section>

      <section className="container-page grid grid-cols-1 gap-6 py-10 sm:grid-cols-3">
        <TrustItem icon={Truck} title="Pan-India Delivery" desc="Shipped safely to your door." />
        <TrustItem icon={ShieldCheck} title="Authentic Weaves" desc="Sourced from trusted weavers." />
        <TrustItem icon={Package} title="Careful Packaging" desc="Every saree wrapped with care." />
      </section>

      <section className="container-page py-10">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl text-ink">Shop by Category</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link key={c.slug} href={`/shop?category=${c.slug}`} className="group">
              <ProductImage
                category={c.slug}
                name={c.name}
                imageUrl={c.image}
                className="transition group-hover:opacity-90"
              />
              <p className="mt-2 text-center text-sm font-medium text-ink group-hover:text-maroon">
                {c.name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page py-10">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl text-ink">Featured Sarees</h2>
          <Link href="/shop" className="text-sm font-medium text-maroon hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {displayFeatured.map((p) => (
            <ProductCard key={p.id} product={p} ratingSummary={ratingSummaries[p.id]} />
          ))}
        </div>
      </section>
    </div>
  );
}

function TrustItem({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-line bg-white/50 p-4">
      <Icon className="h-6 w-6 shrink-0 text-maroon" strokeWidth={1.5} />
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-sm text-ink/80">{desc}</p>
      </div>
    </div>
  );
}
