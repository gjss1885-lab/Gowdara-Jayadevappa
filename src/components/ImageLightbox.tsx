"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

// Full-screen photo viewer opened from ProductGallery. Kept as a plain
// fixed overlay (no portal/dependency) since the whole app only ever
// mounts one of these at a time.
export function ImageLightbox({
  images,
  initialIndex,
  name,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  name: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const hasMultiple = images.length > 1;
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  function prev() {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }
  function next() {
    setIndex((i) => (i + 1) % images.length);
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasMultiple) prev();
      if (e.key === "ArrowRight" && hasMultiple) next();
    }
    window.addEventListener("keydown", handleKey);
    // Lock background scroll while the lightbox is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog on open (onto Close, since it's always
    // present regardless of image count) and back to whatever had focus
    // before it opened (the thumbnail/photo that triggered it) once it
    // closes -- otherwise a keyboard user's focus silently lands back on
    // <body> and they lose their place on the page.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMultiple]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name} — full-size photo`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <X className="h-6 w-6" strokeWidth={1.75} />
      </button>

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-4"
          >
            <ChevronLeft className="h-7 w-7" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-4"
          >
            <ChevronRight className="h-7 w-7" strokeWidth={1.75} />
          </button>
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index]}
        alt={`${name} — photo ${index + 1} of ${images.length}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-full rounded-md object-contain shadow-2xl sm:max-w-[85vw]"
      />

      {hasMultiple && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-sm text-white">
          {index + 1} / {images.length}
        </p>
      )}
    </div>
  );
}

// Small magnifier badge overlaid on the gallery's main photo, hinting that
// it's clickable. Split out so ProductGallery stays easy to read.
export function ZoomHint() {
  return (
    <span className="absolute bottom-3 right-3 rounded-full bg-black/40 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
      <ZoomIn className="h-4 w-4" strokeWidth={1.75} />
    </span>
  );
}
