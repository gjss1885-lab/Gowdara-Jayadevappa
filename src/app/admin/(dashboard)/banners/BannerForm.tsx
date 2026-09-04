"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Banner } from "@/lib/types";

// A failed request doesn't always come back as JSON -- see ProductForm.tsx
// for why this never throws.
async function parseJsonSafe(res: Response): Promise<{ error?: string; url?: string } | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function BannerForm({ initial }: { initial?: Banner }) {
  const router = useRouter();
  const [alt, setAlt] = useState(initial?.alt ?? "");
  const [image, setImage] = useState<string | null>(initial?.image ?? null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/banners/upload-image", {
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

    if (!image) {
      setError("Choose an image first.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(
        initial ? `/api/admin/banners/${initial.id}` : "/api/admin/banners",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image, alt }),
        }
      );
      const data = await parseJsonSafe(res);

      if (!res.ok) {
        setError(data?.error ?? `Something went wrong (server error ${res.status}).`);
        return;
      }

      router.push("/admin/banners");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div className="block text-sm">
        <span className="mb-1 block font-medium text-ink/90">Banner image</span>
        {image && (
          <div className="relative mb-3 h-28 w-full max-w-sm overflow-hidden rounded-md border border-line">
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
            : `${initial ? "Upload a new photo to replace this banner, or leave it as-is. " : ""}Wide shop photos work best (roughly 2000×700px or wider). JPG or PNG, up to 5MB.`}
        </span>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink/90">Alt text (optional)</span>
        <input
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Briefly describe the photo, for accessibility"
          className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-maroon"
        />
        <span className="mt-1 block text-sm text-ink/70">
          Not shown on the page -- read by screen readers only. The slider carries no other text.
        </span>
      </label>

      {error && <p role="alert" className="text-sm text-maroon">{error}</p>}

      <button
        type="submit"
        disabled={submitting || uploading}
        className="rounded-md bg-maroon px-6 py-3 text-sm font-semibold text-white hover:bg-maroon-dark disabled:opacity-60"
      >
        {submitting ? "Saving..." : initial ? "Save Changes" : "Add Banner"}
      </button>
    </form>
  );
}
