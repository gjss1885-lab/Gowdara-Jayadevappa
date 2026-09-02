"use client";

import { useState } from "react";
import { Check, Mail } from "lucide-react";

// A plain footer signup -- collects an email into a list Om can export as
// CSV (see /admin/newsletter) and paste into whatever email tool he later
// picks. Deliberately not a full marketing-email platform: no campaign
// composer, no automation, just "capture the address so it isn't lost."
export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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

  return (
    <div className="border-b border-line py-8">
      <div className="container-page flex flex-col items-center gap-3 text-center">
        <p className="flex items-center gap-2 font-display text-lg text-ink">
          <Mail className="h-5 w-5 text-maroon" aria-hidden="true" />
          Stay in the loop
        </p>
        <p className="max-w-md text-sm text-ink/80">
          New arrivals and offers, straight to your inbox. No spam, unsubscribe any time.
        </p>

        {done ? (
          <p className="flex items-center gap-2 rounded-md border border-line bg-white/60 px-4 py-3 text-sm text-ink/80">
            <Check className="h-4 w-4 shrink-0 text-maroon" /> You&rsquo;re subscribed — thank you!
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <input
              id="newsletter-email"
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
              {submitting ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        )}
        {error && (
          <p role="alert" className="text-sm text-maroon">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
