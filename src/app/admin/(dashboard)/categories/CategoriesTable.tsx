"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  // Reordering just swaps two categories' sortOrder values -- no separate
  // "position" field to manage, and it matches how the list is already
  // sorted for display (see getCategories()). Same approach as the
  // banners reorder buttons (BannersTable.tsx).
  async function swapOrder(a: Category, b: Category) {
    setBusyId(a.id);
    try {
      await Promise.all([
        fetch(`/api/admin/categories/${a.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: b.sortOrder }),
        }),
        fetch(`/api/admin/categories/${b.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: a.sortOrder }),
        }),
      ]);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

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
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line text-ink/80">
            <tr>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">URL slug</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c, i) => (
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
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={i === 0 || busyId !== null}
                      onClick={() => swapOrder(c, categories[i - 1])}
                      aria-label="Move up"
                      title="Move up"
                      className="flex h-7 w-7 items-center justify-center rounded border border-line text-ink/70 hover:border-maroon hover:text-maroon disabled:opacity-30"
                    >
                      &uarr;
                    </button>
                    <button
                      type="button"
                      disabled={i === categories.length - 1 || busyId !== null}
                      onClick={() => swapOrder(c, categories[i + 1])}
                      aria-label="Move down"
                      title="Move down"
                      className="flex h-7 w-7 items-center justify-center rounded border border-line text-ink/70 hover:border-maroon hover:text-maroon disabled:opacity-30"
                    >
                      &darr;
                    </button>
                  </div>
                </td>
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
