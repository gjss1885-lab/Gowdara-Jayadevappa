import { NextResponse } from "next/server";
import { getOrder, updateOrder } from "@/lib/db";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { withApiErrorHandling } from "@/lib/api-utils";
import { sendAdminNewOrderEmail, sendOrderConfirmationEmail } from "@/lib/notifications";

export const POST = withApiErrorHandling(async (request: Request) => {
  const body = await request.json();
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body as {
    orderId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  };

  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
  }

  const existing = await getOrder(orderId);
  if (!existing) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // A valid signature only proves *some* Razorpay payment happened -- it
  // doesn't say which order it was for. Without this check, a signature
  // from a genuine small payment (e.g. a ₹1 order) could be replayed here
  // with a different, more expensive orderId to mark it paid for free.
  // /api/checkout stores razorpayOrderId on the order the moment the
  // Razorpay order is created, so this confirms the payment being verified
  // actually belongs to *this* order before trusting anything else about it.
  if (!existing.razorpayOrderId || existing.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  // Already confirmed (e.g. the client retried this request) -- don't
  // re-send confirmation emails or re-verify a stale signature.
  if (existing.status === "confirmed" || existing.status === "delivered") {
    return NextResponse.json({ ok: true });
  }

  const valid = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!valid) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const order = await updateOrder(orderId, {
    status: "confirmed",
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
  });

  if (order) {
    await sendOrderConfirmationEmail(order).catch((err) =>
      console.error("Order confirmation email failed:", err)
    );
    await sendAdminNewOrderEmail(order).catch((err) =>
      console.error("Admin new-order alert failed:", err)
    );
  }

  return NextResponse.json({ ok: true });
}, { public: true });
