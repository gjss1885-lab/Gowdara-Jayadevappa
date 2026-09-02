import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { getOrder } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { NO_RETURNS_NOTE } from "@/lib/policies";
import { OrderTimeline } from "@/components/OrderTimeline";
import { DownloadInvoiceButton } from "@/components/DownloadInvoiceButton";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <div className="container-page max-w-2xl py-16 text-center">
      <div className="mb-6 text-left">
        <Link href="/account" className="flex items-center gap-1.5 text-sm text-ink/70 hover:text-maroon">
          <ArrowLeft className="h-4 w-4" /> Back to My Account
        </Link>
      </div>

      <CheckCircle2 className="mx-auto h-14 w-14 text-maroon" strokeWidth={1.25} />
      <h1 className="mt-4 font-display text-3xl text-ink">Thank you, {order.customerName.split(" ")[0]}!</h1>
      <p className="mt-2 text-ink/80">
        Your order <span className="font-medium text-ink">#{order.id}</span> has been{" "}
        {order.status === "confirmed" ? "confirmed" : "received"}.
      </p>

      {order.notes && (
        <p className="mx-auto mt-4 max-w-md rounded-md bg-gold-light/30 p-3 text-sm text-ink/80">
          {order.notes}
        </p>
      )}

      <div className="mt-10 rounded-md border border-line bg-white/50 p-6 text-left">
        <OrderTimeline status={order.status} />
      </div>

      <div className="mt-6 flex justify-end">
        <DownloadInvoiceButton order={order} />
      </div>

      <div className="mt-6 space-y-3 rounded-md border border-line bg-white/50 p-5 text-left">
        {order.items.map((item) => (
          <div key={item.productId} className="flex justify-between text-sm text-ink/80">
            <span>
              {item.name} &times; {item.quantity}
            </span>
            <span>{formatINR(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-line pt-3 font-semibold text-ink">
          <span>Total ({order.paymentMethod === "cod" ? "Cash on Delivery" : "Paid Online"})</span>
          <span>{formatINR(order.total)}</span>
        </div>
      </div>

      <div className="mt-6 text-left text-sm text-ink/80">
        <p className="font-medium text-ink/90">Delivering to:</p>
        <p>{order.address}</p>
        <p>
          {order.city}, {order.state} {order.pincode}
        </p>
      </div>

      <Link
        href="/shop"
        className="mt-8 inline-block rounded-md bg-maroon px-6 py-3 text-sm font-semibold text-white hover:bg-maroon-dark"
      >
        Continue Shopping
      </Link>

      <p className="mt-8 text-sm text-ink/70">{NO_RETURNS_NOTE}</p>
    </div>
  );
}
