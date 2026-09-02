import { notFound } from "next/navigation";
import { getCategories, getProduct } from "@/lib/db";
import { ProductForm } from "../../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getProduct(id), getCategories()]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">Edit Product</h1>
      <ProductForm categories={categories} initial={product} />
    </div>
  );
}
