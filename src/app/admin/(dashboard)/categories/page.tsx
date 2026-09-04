import { getCategories, listProducts } from "@/lib/db";
import { CategoriesTable } from "./CategoriesTable";

// Without this, this list is prerendered once at build time -- categories
// added or edited afterward wouldn't show up here until the next deploy.
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const [categories, products] = await Promise.all([getCategories(), listProducts()]);

  const productCounts: Record<string, number> = {};
  for (const p of products) {
    productCounts[p.category] = (productCounts[p.category] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Categories</h1>
        <p className="mt-1 text-sm text-ink/80">
          Add new categories, edit their cover photo and description, or remove ones you no longer
          use. New categories show up immediately in the shop filters and product form.
        </p>
      </div>
      <CategoriesTable categories={categories} productCounts={productCounts} />
    </div>
  );
}
