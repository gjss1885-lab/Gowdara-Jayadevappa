import { NextResponse } from "next/server";
import { getOrder, updateOrder } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/api-utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { orderBelongsToUser } from "@/lib/order-match";
import { canRequestCancellation } from "@/lib/order-status";
import { sendAdminCancellationRequestEmail, sendOrderStatusUpdateEmail } from "@/lib/notifications";

// Customer-facing: lets a logged-in shopper ask to cancel one of their own
// orders. This only ever moves a still-pending order to
// "cancellation_requested" -- it does NOT cancel it outright, so the store
// owner still reviews and confirms the cancellation from the admin panel
// (an order that's already been packed or shipped shouldn't just vanish
// because a customer clicked a button).
export const POST = withApiErrorHandling(async (
  request: Request,
  { params }: RouteContext<"/api/account/orders/[id]/cancel">
) => {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Account login isn't connected yet." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { id } = await params;
  const order = await getOrder(id);
  if (!order || !orderBelongsToUser(order, user)) {
    // Same "not found" whether the order doesn't exist or belongs to
    // someone else -- no reason to reveal which.
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (!canRequestCancellation(order.status)) {
    return NextResponse.json(
      { error: "This order can no longer be cancelled." },
      { status: 400 }
    );
  }

  const updated = await updateOrder(id, { status: "cancellation_requested" });
  if (updated) {
    await sendOrderStatusUpdateEmail(updated).catch((err) =>
      console.error("Cancellation-request email failed:", err)
    );
    await sendAdminCancellationRequestEmail(updated).catch((err) =>
      console.error("Admin cancellation-request alert failed:", err)
    );
  }
  return NextResponse.json({ order: updated });
});
