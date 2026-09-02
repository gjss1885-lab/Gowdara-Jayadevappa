import { NextResponse } from "next/server";
import { listStaleAbandonedCarts, markAbandonedCartsReminded } from "@/lib/db";
import { sendAbandonedCartReminderEmail } from "@/lib/notifications";
import { ABANDONED_CART_REMINDER_HOURS } from "@/lib/config";
import { withApiErrorHandling } from "@/lib/api-utils";

// Called on a schedule by Vercel Cron (see vercel.json) once this is
// deployed -- Vercel signs every cron request with this same header, so
// checking it is what stops a stranger from triggering emails by hitting
// the URL directly. Locally/pre-deploy this can still be tested by hand
// with `curl -H "Authorization: Bearer $CRON_SECRET" .../api/cron/abandoned-carts`,
// but nothing calls it automatically until it's actually deployed and the
// cron schedule is live.
export const GET = withApiErrorHandling(async (request: Request) => {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - ABANDONED_CART_REMINDER_HOURS * 60 * 60 * 1000).toISOString();
  const stale = await listStaleAbandonedCarts(cutoff);

  // Only mark the ones that actually sent -- a failed send (e.g. a Resend
  // hiccup) should be retried on the next cron run, not silently given up
  // on just because this run happened to hit an error.
  const remindedIds: string[] = [];
  for (const cart of stale) {
    try {
      await sendAbandonedCartReminderEmail(cart.email, cart.items, cart.subtotal);
      remindedIds.push(cart.id);
    } catch (err) {
      console.error(`Failed to send abandoned-cart reminder for ${cart.id}:`, err);
    }
  }

  await markAbandonedCartsReminded(remindedIds);

  return NextResponse.json({ checked: stale.length, sent: remindedIds.length });
});
