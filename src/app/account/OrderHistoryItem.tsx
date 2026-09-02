import Link from "next/link";
import clsx from "clsx";
import type { Order } from "@/lib/types";
import { formatINR } from "@/lib/format";
import { canRequestCancellation, getOrderStatusMeta } from "@/lib/order-status";
import { RequestCancellationButton } from "./RequestCancellationButton";

// One row in "Order History" on the account page. Pulled out on its own so
// the status-color logic and the cancellation button live in exactly one
// place.
export function OrderHistoryItem({ order }: { order: Order }) {
  const status = getOrderStatusMeta(order.status);

  return (
    <div className={clsx("rounded-md border p-4 transition hover:border-gold", status.blockClassName)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href={`/order/${order.id}`} className="block">
          <p className="font-medium text-ink">#{order.id}</p>
          <p className="text-sm text-ink/70">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
        </Link>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <span className={clsx("rounded-full px-2.5 py-1 text-sm font-medium", status.badgeClassName)}>
            {status.label}
          </span>
          <span className="font-medium text-maroon">{formatINR(order.total)}</span>
        </div>
      </div>
      {canRequestCancellation(order.status) && (
        <div className="mt-3 border-t border-line/60 pt-3">
          <RequestCancellationButton orderId={order.id} />
        </div>
      )}
    </div>
  );
}
