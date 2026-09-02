"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/lib/types";
import { ORDER_STATUSES, getOrderStatusMeta } from "@/lib/order-status";

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: OrderStatus) {
    setCurrent(next);
    setSaving(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <select
      value={current}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value as OrderStatus)}
      className="rounded-md border border-line bg-white px-2 py-1 text-sm outline-none focus:border-maroon"
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {getOrderStatusMeta(s).label}
        </option>
      ))}
    </select>
  );
}
