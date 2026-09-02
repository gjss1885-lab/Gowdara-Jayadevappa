"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-2 text-sm">
        Delete {name}?
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
