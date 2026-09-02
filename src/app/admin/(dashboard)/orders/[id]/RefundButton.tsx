"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefundButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRefund() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Refund failed.");
        setSubmitting(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Refund failed. Please try again.");
      setSubmitting(false);
    }
  }

  if (confirming) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-ink">Refund the full amount through Razorpay?</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRefund}
            disabled={submitting}
            className="rounded-md bg-maroon px-4 py-2 text-sm font-semibold text-white hover:bg-maroon-dark disabled:opacity-60"
          >
            {submitting ? "Processing..." : "Yes, Refund"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={submitting}
            className="rounded-md border border-line px-4 py-2 text-sm text-ink hover:border-maroon"
          >
            Cancel
          </button>
        </div>
        {error && <p role="alert" className="text-sm text-maroon">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md border border-maroon px-4 py-2 text-sm font-semibold text-maroon hover:bg-maroon hover:text-white"
      >
        Issue Refund
      </button>
      {error && <p role="alert" className="text-sm text-maroon">{error}</p>}
    </div>
  );
}
