"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteCategoryButton({
  id,
  name,
  productCount,
}: {
  id: string;
  name: string;
  productCount: number;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-2 text-sm">
        Delete {name}?
        {productCount > 0 && (
          <span className="text-ink/70">
            ({productCount} product{productCount === 1 ? "" : "s"} will lose this category)
          </span>
        )}
        <button onClick={handleDelete} className="font-semibold text-maroon">
          Yes
        </button>
        <button onClick={() => setConfirming(false)} className="text-ink/70">
          No
        </button>
      </span>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-ink/70 hover:text-maroon">
      Delete
    </button>
  );
}
