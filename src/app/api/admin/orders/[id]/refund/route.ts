import { NextResponse } from "next/server";
import { getOrder, updateOrder } from "@/lib/db";
import { createRazorpayRefund } from "@/lib/razorpay";
import { isRazorpayConfigured } from "@/lib/config";
import { withApiErrorHandling } from "@/lib/api-utils";

// Admin-triggered full refund for a Razorpay-paid order. Reachable only by
// an authenticated admin -- proxy.ts already gates all of /api/admin/*.
export const POST = withApiErrorHandling(async (
  _request: Request,
  { params }: RouteContext<"/api/admin/orders/[id]/refund">
) => {
  if (!isRazorpayConfigured) {
    return NextResponse.json({ error: "Razorpay isn't connected yet." }, { status: 400 });
  }

  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  if (order.paymentMethod !== "razorpay" || !order.razorpayPaymentId) {
    return NextResponse.json(
      { error: "This order wasn't paid online, so there's nothing to refund through Razorpay." },
      { status: 400 }
    );
  }
  if (order.refundStatus === "refunded") {
    return NextResponse.json({ error: "This order has already been refunded." }, { status: 400 });
  }

  try {
    const refund = await createRazorpayRefund(order.razorpayPaymentId, order.total);
    const updated = await updateOrder(id, {
      refundStatus: "refunded",
      razorpayRefundId: refund.id,
    });
    return NextResponse.json({ order: updated });
  } catch (error) {
    await updateOrder(id, { refundStatus: "failed" });
    const message = error instanceof Error ? error.message : "Refund failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
});
