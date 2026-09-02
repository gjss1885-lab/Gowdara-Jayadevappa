import clsx from "clsx";
import Link from "next/link";
import { Download } from "lucide-react";
import { listOrders } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { getOrderStatusMeta } from "@/lib/order-status";
import { OrderStatusSelect } from "./OrderStatusSelect";

// Without this, this list is prerendered once at build time -- new orders
// wouldn't show up here until the next deploy.
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await listOrders();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Orders</h1>
        <Link
          href="/api/admin/orders/export"
          className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-ink hover:border-maroon hover:text-maroon"
        >
          <Download className="h-4 w-4" /> Export CSV
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-ink/80">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-line bg-white/60">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line text-ink/80">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Placed</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const status = getOrderStatusMeta(order.status);
                return (
                  <tr
                    key={order.id}
                    className={clsx("border-b border-line last:border-0", status.blockClassName)}
                  >
                    <td className="px-4 py-3 font-medium text-ink">
                      <Link href={`/admin/orders/${order.id}`} className="hover:text-maroon hover:underline">
                        #{order.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink/80">
                      {order.customerName}
                      <div className="text-sm text-ink/70">{order.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-ink/80">
                      {order.paymentMethod === "razorpay" ? "Razorpay" : "Cash on Delivery"}
                    </td>
                    <td className="px-4 py-3 text-ink/80">{formatINR(order.total)}</td>
                    <td className="px-4 py-3 text-ink/80">
                      {new Date(order.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1.5">
                        <span
                          className={clsx(
                            "rounded-full px-2.5 py-0.5 text-sm font-medium",
                            status.badgeClassName
                          )}
                        >
                          {status.label}
                        </span>
                        <OrderStatusSelect orderId={order.id} status={order.status} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
