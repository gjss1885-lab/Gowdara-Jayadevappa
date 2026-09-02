"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Upload } from "lucide-react";
import { formatINR, discountPercent } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
import { DeleteProductButton } from "./DeleteProductButton";

// A failed request doesn't always come back as JSON -- see ProductForm.tsx
// for why this never throws.
async function parseJsonSafe(
  res: Response
): Promise<{ error?: string; updated?: number; created?: number; errors?: string[] } | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function ProductsTable({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"percent" | "flat">("percent");
  const [value, setValue] = useState("");
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(
    () => (categoryFilter === "all" ? products : products.filter((p) => p.category === categoryFilter)),
    [products, categoryFilter]
  );

  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        visible.forEach((p) => next.delete(p.id));
        return next;
      }
      const next = new Set(prev);
      visible.forEach((p) => next.add(p.id));
      return next;
    });
  }

  async function applyDiscount(discountMode: "percent" | "flat" | "clear") {
    setError(null);
    setMessage(null);

    const numericValue = Number(value);
    if (discountMode !== "clear" && (!value || Number.isNaN(numericValue) || numericValue <= 0)) {
      setError("Enter a discount amount greater than 0.");
      return;
    }

    setApplying(true);
    try {
      const res = await fetch("/api/admin/products/bulk-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: Array.from(selected),
          mode: discountMode,
          value: discountMode === "clear" ? undefined : numericValue,
        }),
      });
      const data = await parseJsonSafe(res);

      if (!res.ok) {
        setError(data?.error ?? `Something went wrong (server error ${res.status}).`);
        return;
      }

      const skipped = data?.errors ?? [];
      setMessage(
        discountMode === "clear"
          ? `Removed the discount on ${data?.updated ?? 0} product(s).`
          : `Applied the discount to ${data?.updated ?? 0} product(s).`
      );
      if (skipped.length > 0) {
        setError(skipped.join(" "));
      }
      setSelected(new Set());
      setValue("");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setApplying(false);
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file after fixing it
    if (!file) return;

    setImporting(true);
    setMessage(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/products/import", { method: "POST", body: formData });
      const data = await parseJsonSafe(res);

      if (!res.ok) {
        setError(data?.error ?? `Something went wrong (server error ${res.status}).`);
        return;
      }

      const rowErrors = data?.errors ?? [];
      setMessage(`Imported: ${data?.created ?? 0} created, ${data?.updated ?? 0} updated.`);
      if (rowErrors.length > 0) {
        setError(`${rowErrors.length} row(s) skipped — ${rowErrors.join(" ")}`);
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink/80">Category</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-line bg-white px-2 py-1.5 outline-none focus:border-maroon"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/api/admin/products/export"
            className="flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm text-ink hover:border-maroon hover:text-maroon"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Link>
          <button
            type="button"
            disabled={importing}
            onClick={() => importInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm text-ink hover:border-maroon hover:text-maroon disabled:opacity-60"
          >
            <Upload className="h-4 w-4" /> {importing ? "Importing..." : "Import CSV"}
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportFile}
            className="hidden"
          />
          <Link
            href="/admin/products/new"
            className="rounded-md bg-maroon px-4 py-2 text-sm font-semibold text-white hover:bg-maroon-dark"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-gold bg-gold-light/20 p-4 text-sm">
          <span className="font-medium text-ink">{selected.size} selected</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "percent" | "flat")}
            className="rounded-md border border-line bg-white px-2 py-1.5 outline-none focus:border-maroon"
          >
            <option value="percent">% off</option>
            <option value="flat">₹ off</option>
          </select>
          <input
            type="number"
            min={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={mode === "percent" ? "e.g. 20" : "e.g. 500"}
            className="w-28 rounded-md border border-line bg-white px-3 py-1.5 outline-none focus:border-maroon"
          />
          <button
            type="button"
            disabled={applying}
            onClick={() => applyDiscount(mode)}
            className="rounded-md bg-maroon px-4 py-1.5 font-semibold text-white hover:bg-maroon-dark disabled:opacity-60"
          >
            {applying ? "Applying..." : "Apply Discount"}
          </button>
          <button
            type="button"
            disabled={applying}
            onClick={() => applyDiscount("clear")}
            className="rounded-md border border-line px-4 py-1.5 font-medium text-ink hover:border-maroon disabled:opacity-60"
          >
            Remove Discount
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-ink/70 hover:text-maroon"
          >
            Clear selection
          </button>
        </div>
      )}

      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p role="alert" className="text-sm text-maroon">{error}</p>}

      <div className="overflow-x-auto rounded-md border border-line bg-white/60">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="border-b border-line text-ink/80">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleOne(p.id)}
                    aria-label={`Select ${p.name}`}
                  />
                </td>
                <td className="px-4 py-3">
                  {p.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-line/60" />
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                <td className="px-4 py-3 text-ink/80">{p.category}</td>
                <td className="px-4 py-3 text-ink/80">
                  {formatINR(p.price)}
                  {p.compareAtPrice && (
                    <span className="ml-2 text-sm text-ink/70 line-through">
                      {formatINR(p.compareAtPrice)}
                    </span>
                  )}
                  {discountPercent(p.price, p.compareAtPrice) !== null && (
                    <span className="ml-2 text-sm font-medium text-green-700">
                      {discountPercent(p.price, p.compareAtPrice)}% off
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink/80">{p.stock}</td>
                <td className="px-4 py-3 text-ink/80">{p.featured ? "Yes" : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/products/${p.id}/edit`} className="text-maroon hover:underline">
                      Edit
                    </Link>
                    <DeleteProductButton id={p.id} name={p.name} />
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
