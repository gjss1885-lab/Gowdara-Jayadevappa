"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { StarRating } from "@/components/StarRating";

const MAX_PHOTOS = 5;

type PendingPhoto = {
  // A local key so photos can be removed/reordered in the UI before the
  // upload resolves -- the eventual Supabase/local URL isn't known yet.
  key: string;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  url?: string;
};

export function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [authorName, setAuthorName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file later
    if (files.length === 0) return;

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setError(`You can attach up to ${MAX_PHOTOS} photos.`);
      return;
    }
    const toUpload = files.slice(0, room);
    if (files.length > room) {
      setError(`You can attach up to ${MAX_PHOTOS} photos -- only the first ${room} were added.`);
    }

    const pending: PendingPhoto[] = toUpload.map((file) => ({
      key: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      previewUrl: URL.createObjectURL(file),
      status: "uploading",
    }));
    setPhotos((prev) => [...prev, ...pending]);

    await Promise.all(
      toUpload.map(async (file, i) => {
        const key = pending[i].key;
        try {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/reviews/upload-image", { method: "POST", body: formData });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error ?? "Upload failed");
          setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, status: "done", url: data.url } : p)));
        } catch {
          setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, status: "error" } : p)));
        }
      })
    );
  }

  function removePhoto(key: string) {
    setPhotos((prev) => prev.filter((p) => p.key !== key));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    if (photos.some((p) => p.status === "uploading")) {
      setError("Please wait for your photos to finish uploading.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const images = photos.filter((p) => p.status === "done" && p.url).map((p) => p.url as string);
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, authorName, email, rating, title, body, images }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <p className="rounded-md border border-line bg-white/60 p-4 text-sm text-ink/80">
        Thanks for your review — it now shows below.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-line bg-white/50 p-4">
      <div>
        <p className="mb-1 text-sm font-medium text-ink">Your rating</p>
        <StarRating value={rating} interactive size="h-6 w-6" onChange={setRating} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Your name" value={authorName} onChange={setAuthorName} required />
        <Field label="Email" value={email} onChange={setEmail} required type="email" />
      </div>
      <Field label="Review title (optional)" value={title} onChange={setTitle} />
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink/90">Your review</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={4}
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-maroon"
        />
      </label>
      <div>
        <p className="mb-1 text-sm font-medium text-ink">Add photos (optional)</p>
        <div className="flex flex-wrap gap-2">
          {photos.map((photo) => (
            <div key={photo.key} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.previewUrl}
                alt=""
                className={"h-full w-full object-cover" + (photo.status === "uploading" ? " opacity-50" : "")}
              />
              {photo.status === "uploading" && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-ink/70">
                  Uploading...
                </span>
              )}
              {photo.status === "error" && (
                <span className="absolute inset-0 flex items-center justify-center bg-white/80 text-[10px] font-medium text-maroon">
                  Failed
                </span>
              )}
              <button
                type="button"
                onClick={() => removePhoto(photo.key)}
                aria-label="Remove photo"
                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-dashed border-line text-xs text-ink/60 hover:border-maroon hover:text-maroon"
            >
              + Add
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesSelected}
          className="hidden"
        />
      </div>
      {error && <p role="alert" className="text-sm text-maroon">{error}</p>}
      <button
        type="submit"
        disabled={submitting || photos.some((p) => p.status === "uploading")}
        className="rounded-md bg-maroon px-5 py-2 text-sm font-semibold text-white transition hover:bg-maroon-dark disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Submit Review"}
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-maroon"
      />
    </label>
  );
}
