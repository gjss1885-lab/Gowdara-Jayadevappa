"use client";

import { useState } from "react";
import clsx from "clsx";
import { ProductImage } from "@/components/ProductImage";
import { ImageLightbox, ZoomHint } from "@/components/ImageLightbox";

// Product detail page's photo display: falls back to the usual styled
// placeholder when no photos have been uploaded yet, otherwise shows the
// selected photo full-size with clickable thumbnails underneath. Clicking
// the main photo (when a real one exists) opens it full-screen.
export function ProductGallery({
  images,
  category,
  name,
}: {
  images: string[];
  category: string;
  name: string;
}) {
  const [selected, setSelected] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (images.length === 0) {
    return <ProductImage category={category} name={name} iconClassName="h-16 w-16" />;
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        aria-label={`View ${name} full-size`}
        className="group relative block w-full cursor-zoom-in text-left"
      >
        <ProductImage category={category} name={name} imageUrl={images[selected]} hideLabel />
        <ZoomHint />
      </button>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setSelected(i)}
              className={clsx(
                "h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition",
                i === selected ? "border-maroon" : "border-transparent opacity-70 hover:opacity-100"
              )}
              aria-label={`Show photo ${i + 1} of ${name}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <ImageLightbox
          images={images}
          initialIndex={selected}
          name={name}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
