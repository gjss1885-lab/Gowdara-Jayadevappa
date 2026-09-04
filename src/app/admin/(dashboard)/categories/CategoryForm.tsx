"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/types";

// A failed request doesn't always come back as JSON -- see ProductForm.tsx
// for why this never throws.
async function parseJsonSafe(res: Response): Promise<{ error?: string; url?: string } | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function CategoryForm({ initial }: { initial?: Category }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
  });
  const [image, setImage] = useState<string | null>(initial?.image ?? null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleFileSelected(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/categories/upload-image", {
        method: "POST",
        body,
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) {
        setError(data?.error ?? `Couldn't upload ${file.name} (server error ${res.status}).`);
        return;
      }
      if (typeof data?.url === "string") {
        setImage(data.url);
      }
    } catch {
      setError("Couldn't reach the server to upload the photo. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    setSubmitting(true);

    const payload = initial
      ? { name: form.name, description: form.description, image }
      : { name: form.name, slug: form.slug || undefined, description: form.description, image };

    try {
      const res = await fetch(
        initial ? `/api/admin/categories/${initial.id}` : "/api/admin/categories",
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

      router.push("/admin/categories");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink/90">Name</span>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-maroon"
        />
      </label>

      {initial ? (
        <div className="text-sm">
          <span className="mb-1 block font-medium text-ink/90">URL slug</span>
          <p className="rounded-md border border-line bg-cream-dark/40 px-3 py-2 text-ink/70">
            {initial.slug}
          </p>
          <span className="mt-1 block text-sm text-ink/70">
            The slug can&apos;t be changed once a category is created -- it&apos;s what keeps
            products linked to this category.
          </span>
        </div>
      ) : (
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink/90">URL slug (optional, auto from name)</span>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => update("slug", e.target.value)}
            className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-maroon"
          />
        </label>
      )}

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink/90">Description</span>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
          className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-maroon"
        />
      </label>

      <div className="block text-sm">
        <span className="mb-1 block font-medium text-ink/90">Cover photo</span>
        {image && (
          <div className="relative mb-3 h-28 w-28 overflow-hidden rounded-md border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => setImage(null)}
              aria-label="Remove photo"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-maroon"
            >
              &times;
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => handleFileSelected(e.target.files)}
          className="block w-full text-sm text-ink/80 file:mr-3 file:rounded-md file:border-0 file:bg-maroon file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-maroon-dark"
        />
        <span className="mt-1 block text-sm text-ink/70">
          {uploading
            ? "Uploading..."
            : "Shown on the homepage \"Shop by Category\" tiles and the shop page. Without one, a styled placeholder is used instead. JPG or PNG, up to 5MB."}
        </span>
      </div>

      {error && <p role="alert" className="text-sm text-maroon">{error}</p>}

      <button
        type="submit"
        disabled={submitting || uploading}
        className="rounded-md bg-maroon px-6 py-3 text-sm font-semibold text-white hover:bg-maroon-dark disabled:opacity-60"
      >
        {submitting ? "Saving..." : initial ? "Save Changes" : "Create Category"}
      </button>
    </form>
  );
}
