import Link from "next/link";
import type { Category } from "@/lib/types";
import { DeleteCategoryButton } from "./DeleteCategoryButton";

export function CategoriesTable({
  categories,
  productCounts,
}: {
  categories: Category[];
  // Number of products currently assigned to each category slug, so the
  // delete confirmation can warn if removing one would leave products
  // uncategorized.
  productCounts: Record<string, number>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/admin/categories/new"
          className="rounded-md bg-maroon px-4 py-2 text-sm font-semibold text-white hover:bg-maroon-dark"
        >
          + Add Category
        </Link>
      </div>

      <div className="overflow-x-auto rounded-md border border-line bg-white/60">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-ink/80">
            <tr>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">URL slug</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-line/60" />
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                <td className="px-4 py-3 text-ink/80">{c.slug}</td>
                <td className="px-4 py-3 text-ink/80">{productCounts[c.slug] ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/categories/${c.id}/edit`} className="text-maroon hover:underline">
                      Edit
                    </Link>
                    <DeleteCategoryButton
                      id={c.id}
                      name={c.name}
                      productCount={productCounts[c.slug] ?? 0}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
