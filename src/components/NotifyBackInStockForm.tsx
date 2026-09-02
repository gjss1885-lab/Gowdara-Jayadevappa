"use client";

import { useState } from "react";
import { BellRing, Check } from "lucide-react";

export function NotifyBackInStockForm({ productId }: { productId: string }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/stock-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <p className="flex items-center gap-2 rounded-md border border-line bg-white/60 px-4 py-3 text-sm text-ink/80">
        <Check className="h-4 w-4 shrink-0 text-maroon" /> We&rsquo;ll email you the moment this is
        back in stock.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
        <BellRing className="h-4 w-4" /> Notify me when back in stock
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-maroon"
        />
        <button
          type="submit"
          disabled={submitting}
          className="shrink-0 rounded-md bg-maroon px-4 py-2 text-sm font-semibold text-white transition hover:bg-maroon-dark disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Notify Me"}
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-maroon">{error}</p>}
    </form>
  );
}
