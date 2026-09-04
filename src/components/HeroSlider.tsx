"use client";

import { useEffect, useState } from "react";
import type { Banner } from "@/lib/types";

// Auto-advances through the admin-managed banner photos (see
// /admin/banners) with a soft crossfade. No text or buttons are overlaid
// on these images -- the homepage used to have a heading/tagline/CTA here,
// but real shop photos sliding behind plain text made the text unreadable,
// so on request the hero is now image-only. Falls back to a plain maroon
// gradient (the section's own background) if no banners exist yet.
const SLIDE_INTERVAL_MS = 5000;
const FADE_MS = 1000;

export function HeroSlider({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [banners.length]);

  if (banners.length === 0) {
    return <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(216,184,118,0.25),transparent_45%)]" />;
  }

  return (
    <div className="absolute inset-0">
      {banners.map((banner, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={banner.id}
          src={banner.image}
          alt={banner.alt || ""}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: i === index ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
          }}
        />
      ))}
      {/* Gentle darkening so the gold temple-border strip at the bottom
          stays legible over a bright photo. */}
      <div className="absolute inset-0 bg-black/10" />
    </div>
  );
}
