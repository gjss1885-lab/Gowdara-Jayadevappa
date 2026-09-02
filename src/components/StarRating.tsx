"use client";

import { Star } from "lucide-react";
import clsx from "clsx";

// Read-only by default (product cards, review listings); pass `interactive`
// + `onChange` to turn it into a star-picker (the review form).
export function StarRating({
  value,
  size = "h-4 w-4",
  interactive = false,
  onChange,
}: {
  value: number;
  size?: string;
  interactive?: boolean;
  onChange?: (value: number) => void;
}) {
  return (
    <div
      className="flex items-center gap-0.5"
      role={interactive ? "radiogroup" : "img"}
      aria-label={interactive ? "Select a rating" : `Rated ${value.toFixed(1)} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const star = (
          <Star
            className={clsx(size, filled ? "fill-gold text-gold" : "text-line")}
            strokeWidth={1.5}
          />
        );
        return interactive ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            onClick={() => onChange?.(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className="p-0.5"
          >
            {star}
          </button>
        ) : (
          <span key={n} aria-hidden>
            {star}
          </span>
        );
      })}
    </div>
  );
}
