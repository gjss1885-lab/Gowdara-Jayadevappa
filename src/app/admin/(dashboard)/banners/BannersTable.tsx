"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Banner } from "@/lib/types";

export function BannersTable({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Reordering just swaps two banners' sortOrder values -- no separate
  // "position" field to manage, and it matches how the list is already
  // sorted for display (see getBanners()).
  async function swapOrder(a: Banner, b: Banner) {
    setBusyId(a.id);
    try {
      await Promise.all([
        fetch(`/api/admin/banners/${a.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: b.sortOrder }),
        }),
        fetch(`/api/admin/banners/${b.id}`, {
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

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/admin/banners/new"
          className="rounded-md bg-maroon px-4 py-2 text-sm font-semibold text-white hover:bg-maroon-dark"
        >
          + Add Banner
        </Link>
      </div>

      {banners.length === 0 ? (
        <p className="rounded-md border border-line bg-white/60 px-4 py-6 text-center text-sm text-ink/70">
          No banners yet. Add one so the homepage slider has something to show -- until then the
          homepage falls back to a plain maroon background.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-line bg-white/60">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-ink/80">
              <tr>
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3">Alt text</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner, i) => (
                <tr key={banner.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={banner.image} alt="" className="h-12 w-24 rounded object-cover" />
                  </td>
                  <td className="px-4 py-3 text-ink/80">
                    {banner.alt || <span className="text-ink/40">&mdash;</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={i === 0 || busyId !== null}
                        onClick={() => swapOrder(banner, banners[i - 1])}
                        aria-label="Move up"
                        title="Move up"
                        className="flex h-7 w-7 items-center justify-center rounded border border-line text-ink/70 hover:border-maroon hover:text-maroon disabled:opacity-30"
                      >
                        &uarr;
                      </button>
                      <button
                        type="button"
                        disabled={i === banners.length - 1 || busyId !== null}
                        onClick={() => swapOrder(banner, banners[i + 1])}
                        aria-label="Move down"
                        title="Move down"
                        className="flex h-7 w-7 items-center justify-center rounded border border-line text-ink/70 hover:border-maroon hover:text-maroon disabled:opacity-30"
                      >
                        &darr;
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      {confirmingId === banner.id ? (
                        <span className="flex items-center gap-2 text-sm">
                          Delete this banner?
                          <button
                            onClick={() => handleDelete(banner.id)}
                            className="font-semibold text-maroon"
                          >
                            Yes
                          </button>
                          <button onClick={() => setConfirmingId(null)} className="text-ink/70">
                            No
                          </button>
                        </span>
                      ) : (
                        <>
                          <Link
                            href={`/admin/banners/${banner.id}/edit`}
                            className="text-maroon hover:underline"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => setConfirmingId(banner.id)}
                            className="text-ink/70 hover:text-maroon"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
