import { listOrders } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/api-utils";

// Escapes a single CSV field: wraps in quotes (doubling any quotes inside)
// whenever the value contains a comma, quote, or newline that would
// otherwise break the format.
function csvField(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const HEADERS = [
  "Order ID",
  "Placed",
  "Customer Name",
  "Email",
  "Phone",
  "Address",
  "City",
  "State",
  "Pincode",
  "Payment Method",
  "Status",
  "Refund Status",
  "Items",
  "Subtotal",
  "Shipping",
  "Total",
];

export const GET = withApiErrorHandling(async () => {
  const orders = await listOrders();

  const rows = orders.map((order) =>
    [
      order.id,
      new Date(order.createdAt).toISOString(),
      order.customerName,
      order.email,
      order.phone,
      order.address,
      order.city,
      order.state,
      order.pincode,
      order.paymentMethod === "razorpay" ? "Razorpay" : "Cash on Delivery",
      order.status,
      order.refundStatus ?? "none",
      order.items.map((i) => `${i.name} x${i.quantity}`).join("; "),
      order.subtotal,
      order.shipping,
      order.total,
    ]
      .map(csvField)
      .join(",")
  );

  const csv = [HEADERS.join(","), ...rows].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${date}.csv"`,
    },
  });
});
