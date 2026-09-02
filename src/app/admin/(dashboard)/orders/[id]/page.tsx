import { notFound } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { ArrowLeft } from "lucide-react";
import { getOrder } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { getOrderStatusMeta } from "@/lib/order-status";
import { isRazorpayConfigured } from "@/lib/config";
import { OrderStatusSelect } from "../OrderStatusSelect";
import { RefundButton } from "./RefundButton";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const status = getOrderStatusMeta(order.status);
  const canRefund =
    isRazorpayConfigured &&
    order.paymentMethod === "razorpay" &&
    Boolean(order.razorpayPaymentId) &&
    order.refundStatus !== "refunded";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/orders" className="flex items-center gap-1.5 text-sm text-ink/70 hover:text-maroon">
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink">Order #{order.id}</h1>
          <p className="text-sm text-ink/70">
            Placed{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <span className={clsx("rounded-full px-3 py-1 text-sm font-medium", status.badgeClassName)}>
          {status.label}
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-md border border-line bg-white/60 p-4">
          <h2 className="mb-3 font-display text-lg text-ink">Customer</h2>
          <dl className="space-y-1.5 text-sm">
            <Row label="Name" value={order.customerName} />
            <Row label="Email" value={order.email} />
            <Row label="Phone" value={order.phone} />
          </dl>
        </section>

        <section className="rounded-md border border-line bg-white/60 p-4">
          <h2 className="mb-3 font-display text-lg text-ink">Shipping Address</h2>
          <p className="text-sm text-ink/90">
            {order.address}
            <br />
            {order.city}, {order.state} {order.pincode}
          </p>
        </section>

        <section className="rounded-md border border-line bg-white/60 p-4">
          <h2 className="mb-3 font-display text-lg text-ink">Payment</h2>
          <dl className="space-y-1.5 text-sm">
            <Row label="Method" value={order.paymentMethod === "razorpay" ? "Paid Online (Razorpay)" : "Cash on Delivery"} />
            {order.razorpayOrderId && <Row label="Razorpay Order ID" value={order.razorpayOrderId} mono />}
            {order.razorpayPaymentId && <Row label="Razorpay Payment ID" value={order.razorpayPaymentId} mono />}
            {order.refundStatus && order.refundStatus !== "none" && (
              <Row label="Refund" value={order.refundStatus} />
            )}
          </dl>
          {canRefund && (
            <div className="mt-4 border-t border-line pt-4">
              <RefundButton orderId={order.id} />
            </div>
          )}
        </section>

        <section className="rounded-md border border-line bg-white/60 p-4">
          <h2 className="mb-3 font-display text-lg text-ink">Status</h2>
          <OrderStatusSelect orderId={order.id} status={order.status} />
        </section>
      </div>

      <section className="rounded-md border border-line bg-white/60 p-4">
        <h2 className="mb-3 font-display text-lg text-ink">Items Ordered</h2>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-ink/70">
            <tr>
              <th className="py-2">Product</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.productId} className="border-b border-line/60 last:border-0">
                <td className="py-2 text-ink/90">{item.name}</td>
                <td className="py-2 text-right text-ink/80">{item.quantity}</td>
                <td className="py-2 text-right text-ink/80">{formatINR(item.price)}</td>
                <td className="py-2 text-right text-ink/90">{formatINR(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ml-auto mt-3 w-full max-w-[220px] space-y-1 text-sm">
          <div className="flex justify-between text-ink/80">
            <span>Subtotal</span>
            <span>{formatINR(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink/80">
            <span>Shipping</span>
            <span>{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</span>
          </div>
          <div className="flex justify-between border-t border-line pt-1 font-semibold text-ink">
            <span>Total</span>
            <span>{formatINR(order.total)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink/60">{label}</dt>
      <dd className={clsx("text-right text-ink/90", mono && "break-all font-mono text-xs")}>{value}</dd>
    </div>
  );
}
