"use client";

import { useEffect, useState } from "react";
import type { Banner } from "@/lib/types";

// Auto-advances through the admin-managed banner photos (see
// /admin/banners) with a real horizontal slide (not a crossfade). No text
// or buttons are overlaid on these images -- the homepage used to have a
// heading/tagline/CTA here, but real shop photos sliding behind plain text
// made the text unreadable, so on request the hero is now image-only.
// Falls back to a plain maroon gradient (the section's own background) if
// no banners exist yet.
const SLIDE_INTERVAL_MS = 5000;
const SLIDE_TRANSITION_MS = 700;

export function HeroSlider({ banners }: { banners: Banner[] }) {
  const hasMultiple = banners.length > 1;
  // A trailing clone of the first banner lets the last-slide-to-first-slide
  // wrap animate as a forward slide instead of snapping backwards -- once
  // the real slide reaches this clone, we jump back to the real first slide
  // with the transition briefly turned off (an identical frame, so the
  // jump is invisible).
  const slides = hasMultiple ? [...banners, banners[0]] : banners;

  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    if (!hasMultiple) return;
    const id = setInterval(() => {
      setAnimate(true);
      setIndex((i) => i + 1);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hasMultiple]);

  // Once we've slid onto the trailing clone, wait for that slide animation
  // to finish, then snap back to the real first slide with no transition.
  useEffect(() => {
    if (!hasMultiple || index !== banners.length) return;
    const timeout = setTimeout(() => {
      setAnimate(false);
      setIndex(0);
    }, SLIDE_TRANSITION_MS);
    return () => clearTimeout(timeout);
  }, [index, hasMultiple, banners.length]);

  // Re-enable the transition on the next frame after an instant reset, so
  // the *next* slide still animates normally instead of staying frozen.
  useEffect(() => {
    if (animate) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [animate]);

  if (banners.length === 0) {
    return <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(216,184,118,0.25),transparent_45%)]" />;
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="flex h-full"
        style={{
          width: `${slides.length * 100}%`,
          transform: `translateX(-${(index * 100) / slides.length}%)`,
          transition: animate ? `transform ${SLIDE_TRANSITION_MS}ms ease-in-out` : "none",
        }}
      >
        {slides.map((banner, i) => (
          <div key={`${banner.id}-${i}`} className="h-full" style={{ width: `${100 / slides.length}%` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={banner.image} alt={banner.alt || ""} className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
      {/* Gentle darkening so the gold temple-border strip at the bottom
          stays legible over a bright photo. */}
      <div className="absolute inset-0 bg-black/10" />
    </div>
  );
}
