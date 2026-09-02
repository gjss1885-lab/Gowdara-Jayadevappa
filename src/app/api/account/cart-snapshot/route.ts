import { NextResponse } from "next/server";
import { upsertAbandonedCartSnapshot } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { withApiErrorHandling } from "@/lib/api-utils";
import type { OrderItem } from "@/lib/types";

// Called once from the checkout page (see CheckoutForm.tsx) when a
// logged-in customer loads it with a non-empty cart. Powers the
// abandoned-cart reminder email -- see src/app/api/cron/abandoned-carts.
// Best-effort and silent: nothing here should ever block or interrupt an
// actual checkout, so the client fires this and ignores the result.
export const POST = withApiErrorHandling(async (request: Request) => {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user) {
    return NextResponse.json({ ok: false });
  }

  // Same fallback chain ProfileForm/account page use: prefer the contact
  // email the customer set on their profile, else their real login email.
  // Phone-only accounts with no email on file have nowhere to send a
  // reminder, so there's nothing useful to snapshot for them.
  const email =
    (typeof user.user_metadata?.email === "string" && user.user_metadata.email) || user.email || "";
  if (!email) {
    return NextResponse.json({ ok: false });
  }

  const body = (await request.json()) as { items?: OrderItem[]; subtotal?: number };
  if (!body.items?.length || typeof body.subtotal !== "number") {
    return NextResponse.json({ ok: false });
  }

  await upsertAbandonedCartSnapshot(user.id, email, body.items, body.subtotal);
  return NextResponse.json({ ok: true });
});
