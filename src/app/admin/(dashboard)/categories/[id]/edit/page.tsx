import { notFound } from "next/navigation";
import { getCategories } from "@/lib/db";
import { CategoryForm } from "../../CategoryForm";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">Edit Category</h1>
      <CategoryForm initial={category} />
    </div>
  );
}
