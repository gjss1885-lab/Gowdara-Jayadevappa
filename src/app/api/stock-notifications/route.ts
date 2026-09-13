import { NextResponse } from "next/server";
import { createStockNotification, getProduct } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/api-utils";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const POST = withApiErrorHandling(async (request: Request) => {
  const ip = getClientIp(request);
  if (!rateLimit(`stock-notify:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Please try again later." }, { status: 429 });
  }

  const { productId, email } = (await request.json()) as { productId?: string; email?: string };

  if (!productId || !email?.trim()) {
    return NextResponse.json({ error: "Please enter your email." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  const product = await getProduct(productId);
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  await createStockNotification(productId, email.trim());
  return NextResponse.json({ ok: true });
}, { public: true });
