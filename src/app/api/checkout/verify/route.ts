import { NextResponse } from "next/server";
import { updateOrder } from "@/lib/db";
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
});
