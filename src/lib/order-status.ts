import type { OrderStatus } from "./types";

// Single source of truth for every order status: its display label and its
// colors, so the customer-facing account page, the order detail page, and
// the admin orders table all agree on what "confirmed" or "cancelled"
// looks like instead of drifting apart over time.
export const ORDER_STATUSES: OrderStatus[] = [
  "pending_payment",
  "confirmed",
  "cancellation_requested",
  "shipped",
  "delivered",
  "cancelled",
];

type StatusMeta = {
  label: string;
  // Small pill (e.g. "Delivered").
  badgeClassName: string;
  // Whole-card/row tint so a status is visible at a glance, not just in
  // the badge text.
  blockClassName: string;
};

const STATUS_META: Record<OrderStatus, StatusMeta> = {
  pending_payment: {
    label: "Pending Payment",
    badgeClassName: "bg-amber-100 text-amber-800",
    blockClassName: "border-amber-200 bg-amber-50/60",
  },
  confirmed: {
    label: "Confirmed",
    badgeClassName: "bg-blue-100 text-blue-800",
    blockClassName: "border-blue-200 bg-blue-50/50",
  },
  cancellation_requested: {
    label: "Cancellation Requested",
    badgeClassName: "bg-orange-100 text-orange-800",
    blockClassName: "border-orange-300 bg-orange-50/70",
  },
  shipped: {
    label: "Shipped",
    badgeClassName: "bg-sky-100 text-sky-800",
    blockClassName: "border-sky-200 bg-sky-50/50",
  },
  delivered: {
    label: "Delivered",
    badgeClassName: "bg-green-100 text-green-800",
    blockClassName: "border-green-200 bg-green-50/50",
  },
  cancelled: {
    label: "Cancelled",
    badgeClassName: "bg-red-100 text-red-800",
    blockClassName: "border-red-200 bg-red-50/50",
  },
};

const FALLBACK_META: StatusMeta = {
  label: "Unknown",
  badgeClassName: "bg-line text-ink/80",
  blockClassName: "border-line bg-white/50",
};

export function getOrderStatusMeta(status: OrderStatus): StatusMeta {
  return STATUS_META[status] ?? FALLBACK_META;
}

// A customer can only ask to cancel while the order hasn't shipped yet, and
// only once -- no point offering it again on an order that's already
// cancelled, already fulfilled, or already has a pending request.
export function canRequestCancellation(status: OrderStatus): boolean {
  return status === "pending_payment" || status === "confirmed";
}
