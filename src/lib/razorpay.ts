import "server-only";
import { createHmac } from "node:crypto";

// Thin wrapper around the Razorpay REST API (Orders API) using fetch, so we
// don't need the razorpay npm SDK as a dependency. Standard Razorpay
// integration: https://razorpay.com/docs/api/orders/

function getCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing).");
  }
  return { keyId, keySecret };
}

export async function createRazorpayOrder(amountInRupees: number, receipt: string) {
  const { keyId, keySecret } = getCredentials();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amountInRupees * 100), // paise
      currency: "INR",
      receipt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay order creation failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<{ id: string; amount: number; currency: string }>;
}

// Full refund (no `amount` sent) unless a specific rupee amount is given.
// https://razorpay.com/docs/api/refunds/create/
export async function createRazorpayRefund(paymentId: string, amountInRupees?: number) {
  const { keyId, keySecret } = getCredentials();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      amountInRupees !== undefined ? { amount: Math.round(amountInRupees * 100) } : {}
    ),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay refund failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<{ id: string; status: string }>;
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { keySecret } = getCredentials();
  const expected = createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}
