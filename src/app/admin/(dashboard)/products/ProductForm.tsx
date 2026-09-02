"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, Product } from "@/lib/types";

// A failed request doesn't always come back as JSON (an uncaught server
// error can return an empty body) -- calling res.json() directly on that
// throws and crashes the whole page instead of showing an error message.
// This never throws: it returns null if the body isn't valid JSON.
async function parseJsonSafe(res: Response): Promise<{ error?: string; url?: string } | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// If this product already has a discount (compareAtPrice set), the exact
// discount amount is recoverable exactly as a flat rupee figure -- a
// percentage would have to be re-derived by dividing and rounding, which
// could drift from whatever number was actually typed in originally.
function initialDiscount(initial?: Product): { mode: DiscountMode; value: string } {
  if (!initial?.compareAtPrice) return { mode: "none", value: "" };
  return { mode: "flat", value: String(initial.compareAtPrice - initial.price) };
}

type DiscountMode = "none" | "percent" | "flat";

// Mirrors the math in api/admin/products/bulk-discount/route.ts so a single
// product's discount (set here) and a bulk discount (set from the products
// list) behave identically.
function applyDiscount(
  original: number,
  mode: DiscountMode,
  value: number
): number | null {
  if (mode === "none" || !Number.isFinite(original) || original <= 0) return null;
  const discounted =
    mode === "percent" ? Math.round(original * (1 - value / 100)) : Math.round(original - value);
  return discounted >= 1 ? discounted : null;
}

export function ProductForm({
  categories,
  initial,
}: {
  categories: Category[];
  initial?: Product;
}) {
  const router = useRouter();
  const { mode: initialMode, value: initialValue } = initialDiscount(initial);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    category: initial?.category ?? categories[0]?.slug ?? "",
    // The "regular" price -- when a discount is active below, this is the
    // original (crossed-out) price rather than what's actually charged.
    price: (initial?.compareAtPrice ?? initial?.price)?.toString() ?? "",
    description: initial?.description ?? "",
    fabric: initial?.fabric ?? "",
    color: initial?.color ?? "",
    stock: initial?.stock?.toString() ?? "0",
    featured: initial?.featured ?? false,
  });
  const [discountMode, setDiscountMode] = useState<DiscountMode>(initialMode);
  const [discountValue, setDiscountValue] = useState(initialValue);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const originalPrice = Number(form.price);
  const discountedPrice =
    discountMode !== "none" && discountValue
      ? applyDiscount(originalPrice, discountMode, Number(discountValue))
      : null;

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(fileList)) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/admin/products/upload-image", {
          method: "POST",
          body,
        });
        const data = await parseJsonSafe(res);
        if (!res.ok) {
          setError(data?.error ?? `Couldn't upload ${file.name} (server error ${res.status}).`);
          continue;
        }
        if (typeof data?.url === "string") {
          setImages((prev) => [...prev, data.url as string]);
        }
      }
    } catch {
      setError("Couldn't reach the server to upload the photo. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  function update<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let price = originalPrice;
    let compareAtPrice: number | null = null;

    if (discountMode !== "none") {
      const value = Number(discountValue);
      if (!discountValue || !Number.isFinite(value) || value <= 0) {
        setError("Enter a discount amount greater than 0, or set Discount back to \"No discount\".");
        return;
      }
      if (discountMode === "percent" && value >= 100) {
        setError("Percentage discount must be less than 100.");
        return;
      }
      const discounted = applyDiscount(originalPrice, discountMode, value);
      if (discounted == null) {
        setError("That discount is too large -- the price would drop below ₹1.");
        return;
      }
      price = discounted;
      compareAtPrice = originalPrice;
    }

    setSubmitting(true);

    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      category: form.category,
      price,
      compareAtPrice,
      description: form.description,
      fabric: form.fabric,
      color: form.color,
      stock: Number(form.stock),
      featured: form.featured,
      images,
    };

    try {
      const res = await fetch(
        initial ? `/api/admin/products/${initial.id}` : "/api/admin/products",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await parseJsonSafe(res);

      if (!res.ok) {
        setError(data?.error ?? `Something went wrong (server error ${res.status}).`);
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" value={form.name} onChange={(v) => update("name", v)} required />
        <Field
          label="Slug (optional, auto from name)"
          value={form.slug}
          onChange={(v) => update("slug", v)}
        />
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink/90">Category</span>
        <select
          value={form.category}
          onChange={(e) => update("category", e.target.value)}
          className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-maroon"
        >
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={discountMode === "none" ? "Price (INR)" : "Regular Price (INR)"}
          value={form.price}
          onChange={(v) => update("price", v)}
          required
          type="number"
        />
        <Field label="Stock" value={form.stock} onChange={(v) => update("stock", v)} type="number" />
      </div>

      <div className="rounded-md border border-line bg-white/50 p-4">
        <span className="mb-2 block text-sm font-medium text-ink/90">Discount</span>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={discountMode}
            onChange={(e) => setDiscountMode(e.target.value as DiscountMode)}
            className="rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-maroon"
          >
            <option value="none">No discount</option>
            <option value="percent">% off</option>
            <option value="flat">₹ off</option>
          </select>
          {discountMode !== "none" && (
            <input
              type="number"
              min={1}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountMode === "percent" ? "e.g. 20" : "e.g. 500"}
              className="w-32 rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-maroon"
            />
          )}
        </div>
        {discountMode !== "none" && (
          <p className="mt-2 text-sm text-ink/80">
            {discountedPrice != null ? (
              <>
                Customers pay{" "}
                <span className="font-semibold text-maroon">₹{discountedPrice.toLocaleString("en-IN")}</span>
                {" "}<span className="line-through">₹{originalPrice.toLocaleString("en-IN")}</span>
              </>
            ) : (
              "Enter the regular price above and a discount amount to see the sale price."
            )}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fabric" value={form.fabric} onChange={(v) => update("fabric", v)} />
        <Field label="Color" value={form.color} onChange={(v) => update("color", v)} />
      </div>

      <div className="block text-sm">
        <span className="mb-1 block font-medium text-ink/90">Photos</span>
        {images.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-3">
            {images.map((url, i) => (
              <div key={url} className="relative h-24 w-24 overflow-hidden rounded-md border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5 text-center text-[11px] text-white">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-maroon"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="block w-full text-sm text-ink/80 file:mr-3 file:rounded-md file:border-0 file:bg-maroon file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-maroon-dark"
        />
        <span className="mt-1 block text-sm text-ink/70">
          {uploading
            ? "Uploading..."
            : "The first photo is used as the cover image. JPG or PNG, up to 5MB each."}
        </span>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink/90">Description</span>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={4}
          className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-maroon"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => update("featured", e.target.checked)}
        />
        Feature on homepage
      </label>

      {error && <p role="alert" className="text-sm text-maroon">{error}</p>}

      <button
        type="submit"
        disabled={submitting || uploading}
        className="rounded-md bg-maroon px-6 py-3 text-sm font-semibold text-white hover:bg-maroon-dark disabled:opacity-60"
      >
        {submitting ? "Saving..." : initial ? "Save Changes" : "Create Product"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink/90">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-maroon"
      />
    </label>
  );
}
