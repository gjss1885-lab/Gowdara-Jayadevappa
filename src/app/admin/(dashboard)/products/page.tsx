import { getCategories, listProducts } from "@/lib/db";
import { ProductsTable } from "./ProductsTable";

// Without this, this list is prerendered once at build time -- products
// added or edited afterward wouldn't show up here until the next deploy.
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([listProducts(), getCategories()]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">Products</h1>
      <ProductsTable products={products} categories={categories} />
    </div>
  );
}
