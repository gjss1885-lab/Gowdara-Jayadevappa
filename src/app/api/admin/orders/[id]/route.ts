import { NextResponse } from "next/server";
import { updateOrder } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/api-utils";
import { ORDER_STATUSES } from "@/lib/order-status";
import { sendOrderStatusUpdateEmail } from "@/lib/notifications";
import type { OrderStatus } from "@/lib/types";

export const PATCH = withApiErrorHandling(async (
  request: Request,
  { params }: RouteContext<"/api/admin/orders/[id]">
) => {
  const { id } = await params;
  const { status } = (await request.json()) as { status?: OrderStatus };

  if (!status || !ORDER_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const order = await updateOrder(id, { status });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  await sendOrderStatusUpdateEmail(order).catch((err) =>
    console.error("Order status email failed:", err)
  );

  return NextResponse.json({ order });
});
