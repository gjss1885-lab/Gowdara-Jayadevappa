import { NextResponse } from "next/server";
import { createNewsletterSubscriber } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/api-utils";

export const POST = withApiErrorHandling(async (request: Request) => {
  const { email } = (await request.json()) as { email?: string };

  if (!email?.trim()) {
    return NextResponse.json({ error: "Please enter your email." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  await createNewsletterSubscriber(email.trim());
  return NextResponse.json({ ok: true });
});
