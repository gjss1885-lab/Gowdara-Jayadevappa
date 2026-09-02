import type { MetadataRoute } from "next";
import { listProducts, getCategories } from "@/lib/db";
import { siteUrl } from "@/lib/config";

// Next.js serves this at /sitemap.xml automatically. Regenerated on every
// request (see the `dynamic` export below) so it always reflects the
// current catalog -- same reasoning as the `force-dynamic` pages/admin
// listings elsewhere in the app.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([listProducts(), getCategories()]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/contact`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.1 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${siteUrl}/shop?category=${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${siteUrl}/product/${p.slug}`,
    lastModified: new Date(p.createdAt),
    changeFrequency: "weekly",
    priority: 0.8,
    images: p.images && p.images.length > 0 ? p.images : undefined,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
