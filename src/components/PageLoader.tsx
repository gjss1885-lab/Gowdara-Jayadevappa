// Shown automatically by Next.js (via each route's loading.tsx) while a page
// is fetching data server-side and taking a moment to arrive. Fast
// navigations never see this -- it only appears once a transition is
// actually slow enough to notice.
export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-24">
      <span className="relative flex h-12 w-12 items-center justify-center" aria-hidden>
        <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-line border-t-maroon" />
        <span className="absolute inset-1.5 animate-spin rounded-full border-[3px] border-transparent border-t-gold [animation-direction:reverse] [animation-duration:1.4s]" />
      </span>
      <p className="font-display text-sm uppercase tracking-[0.2em] text-ink/70">{label}</p>
      <span className="sr-only" role="status">
        {label}…
      </span>
    </div>
  );
}
