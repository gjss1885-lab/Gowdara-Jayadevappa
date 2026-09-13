import { NextResponse } from "next/server";
import { createNewsletterSubscriber } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/api-utils";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const POST = withApiErrorHandling(async (request: Request) => {
  const ip = getClientIp(request);
  if (!rateLimit(`newsletter:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Please try again later." }, { status: 429 });
  }

  const { email } = (await request.json()) as { email?: string };

  if (!email?.trim()) {
    return NextResponse.json({ error: "Please enter your email." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  await createNewsletterSubscriber(email.trim());
  return NextResponse.json({ ok: true });
}, { public: true });
