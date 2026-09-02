import { getCategories } from "@/lib/db";
import { ProductForm } from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await getCategories();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">Add Product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
