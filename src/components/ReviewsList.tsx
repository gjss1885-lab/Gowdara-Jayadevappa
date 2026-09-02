"use client";

import { useState } from "react";
import { StarRating } from "@/components/StarRating";
import { ImageLightbox } from "@/components/ImageLightbox";
import type { Review } from "@/lib/types";

export function ReviewsList({ reviews }: { reviews: Review[] }) {
  // Which review's photos are open in the lightbox, and which photo within
  // it -- null means closed. Reviews are read-only display, so this is the
  // only interactive state this component needs.
  const [lightbox, setLightbox] = useState<{ reviewId: string; index: number } | null>(null);

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-ink/70">No reviews yet — be the first to share your thoughts.</p>
    );
  }

  const openReview = reviews.find((r) => r.id === lightbox?.reviewId);

  return (
    <div className="space-y-5">
      {reviews.map((r) => (
        <div key={r.id} className="border-b border-line pb-5 last:border-0">
          <div className="flex flex-wrap items-center gap-2">
            <StarRating value={r.rating} />
            <span className="text-sm font-medium text-ink">{r.authorName}</span>
            {r.verifiedPurchase && (
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                Verified Purchase
              </span>
            )}
          </div>
          {r.title && <p className="mt-1.5 font-medium text-ink">{r.title}</p>}
          <p className="mt-1 text-sm leading-relaxed text-ink/80">{r.body}</p>
          {r.images && r.images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {r.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setLightbox({ reviewId: r.id, index: i })}
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-line hover:border-maroon"
                  aria-label={`View photo ${i + 1} from ${r.authorName}'s review`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <p className="mt-1.5 text-xs text-ink/70">
            {new Date(r.createdAt).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      ))}

      {lightbox && openReview?.images && (
        <ImageLightbox
          images={openReview.images}
          initialIndex={lightbox.index}
          name={`${openReview.authorName}'s review`}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
