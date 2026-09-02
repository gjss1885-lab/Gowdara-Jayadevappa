"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RequestCancellationButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/account/orders/${orderId}/cancel`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't request cancellation. Please try again.");
        return;
      }
      setConfirming(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink/80">Request cancellation for this order?</span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="font-semibold text-maroon hover:underline disabled:opacity-60"
        >
          {loading ? "Requesting…" : "Yes, request it"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="text-ink/70 hover:underline disabled:opacity-60"
        >
          No
        </button>
        {error && <span className="w-full text-sm text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-sm font-medium text-maroon hover:underline"
    >
      Request Cancellation
    </button>
  );
}
