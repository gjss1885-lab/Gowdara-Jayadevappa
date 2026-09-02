import "server-only";
import { emailShell, sendEmail } from "@/lib/email";
import { formatINR } from "@/lib/format";
import { getOrderStatusMeta } from "@/lib/order-status";
import { adminOrderEmail, siteUrl } from "@/lib/config";
import type { Order, OrderItem, Product } from "@/lib/types";

// Every place in the app that needs to email a customer about an order or
// a restock goes through one of these, so the templates only live in one
// place. Each function is safe to call even when email isn't configured --
// sendEmail() itself no-ops in that case.

function itemsTableHtml(order: Order): string {
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 6px 0;">${item.name} &times; ${item.quantity}</td>
          <td style="padding: 6px 0; text-align: right;">${formatINR(item.price * item.quantity)}</td>
        </tr>`
    )
    .join("");
  return `
    <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
      ${rows}
      <tr style="border-top: 1px solid #e5dcc8;">
        <td style="padding: 8px 0; font-weight: bold;">Total</td>
        <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatINR(order.total)}</td>
      </tr>
    </table>`;
}

export async function sendOrderConfirmationEmail(order: Order): Promise<void> {
  await sendEmail({
    to: order.email,
    subject: `Order confirmed — #${order.id}`,
    html: emailShell(`
      <p>Hi ${order.customerName},</p>
      <p>Thank you for your order! Here's a summary of what you ordered:</p>
      ${itemsTableHtml(order)}
      <p>
        Shipping to: ${order.address}, ${order.city}, ${order.state} ${order.pincode}<br/>
        Payment: ${order.paymentMethod === "razorpay" ? "Paid online" : "Cash on Delivery"}
      </p>
      <p>We'll let you know as soon as your order ships.</p>
    `),
  });
}

export async function sendOrderStatusUpdateEmail(order: Order): Promise<void> {
  const status = getOrderStatusMeta(order.status);
  await sendEmail({
    to: order.email,
    subject: `Order #${order.id} — ${status.label}`,
    html: emailShell(`
      <p>Hi ${order.customerName},</p>
      <p>Your order <strong>#${order.id}</strong> is now: <strong>${status.label}</strong>.</p>
      ${itemsTableHtml(order)}
    `),
  });
}

// --- Admin order alerts (a separate inbox from the customer-facing emails
// above) -- see adminOrderEmail in src/lib/config.ts for where these go. ---

function orderAdminLinkHtml(orderId: string): string {
  return `
    <p style="margin: 16px 0;">
      <a href="${siteUrl}/admin/orders/${orderId}"
         style="background: #7a1f2b; color: #faf6ee; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
        View order in admin
      </a>
    </p>`;
}

// Sent once per real order -- from the COD branch of /api/checkout for a
// Cash on Delivery order, or from /api/checkout/verify once a Razorpay
// payment has actually been verified -- so this fires exactly once per
// order regardless of payment method, same as sendOrderConfirmationEmail
// above (which it's always called alongside).
export async function sendAdminNewOrderEmail(order: Order): Promise<void> {
  await sendEmail({
    to: adminOrderEmail,
    subject: `New order — #${order.id} (${formatINR(order.total)})`,
    html: emailShell(`
      <p>New order from ${order.customerName}.</p>
      ${itemsTableHtml(order)}
      <p>
        Customer: ${order.customerName} &middot; ${order.email} &middot; ${order.phone}<br/>
        Shipping to: ${order.address}, ${order.city}, ${order.state} ${order.pincode}<br/>
        Payment: ${order.paymentMethod === "razorpay" ? "Paid online (Razorpay)" : "Cash on Delivery"}
      </p>
      ${orderAdminLinkHtml(order.id)}
    `),
  });
}

// Sent when a logged-in customer requests a cancellation from their
// account page (POST /api/account/orders/[id]/cancel). This only ever
// moves an order to "cancellation_requested" -- it doesn't cancel it
// outright -- so the admin alert exists specifically to prompt Om to go
// review and confirm (or decline) it from the admin panel; it isn't sent
// for every status change Om makes himself from that same panel, since
// notifying him about his own action would just be noise.
export async function sendAdminCancellationRequestEmail(order: Order): Promise<void> {
  await sendEmail({
    to: adminOrderEmail,
    subject: `Cancellation requested — Order #${order.id}`,
    html: emailShell(`
      <p>${order.customerName} (${order.email}) has requested to cancel order <strong>#${order.id}</strong>.</p>
      ${itemsTableHtml(order)}
      <p>Review it in the admin panel to confirm the cancellation or follow up with the customer.</p>
      ${orderAdminLinkHtml(order.id)}
    `),
  });
}

// Sent by the abandoned-cart cron (src/app/api/cron/abandoned-carts) to a
// logged-in customer who loaded checkout with items in their cart and
// never placed the order. The "Complete your order" link goes to /cart --
// it only actually has the items in it if this is the same browser the
// customer originally shopped in, since the cart itself lives in that
// browser's local storage, not tied to their account server-side. A known,
// deliberate limitation rather than an oversight: reminding them what they
// wanted is still useful even if they have to re-add it from a different
// device.
export async function sendAbandonedCartReminderEmail(
  email: string,
  items: OrderItem[],
  subtotal: number
): Promise<void> {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 6px 0;">${item.name} &times; ${item.quantity}</td>
          <td style="padding: 6px 0; text-align: right;">${formatINR(item.price * item.quantity)}</td>
        </tr>`
    )
    .join("");

  await sendEmail({
    to: email,
    subject: "You left something in your cart",
    html: emailShell(`
      <p>Looks like you left a few things behind!</p>
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
        ${rows}
        <tr style="border-top: 1px solid #e5dcc8;">
          <td style="padding: 8px 0; font-weight: bold;">Subtotal</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatINR(subtotal)}</td>
        </tr>
      </table>
      <p style="margin: 16px 0;">
        <a href="${siteUrl}/cart"
           style="background: #7a1f2b; color: #faf6ee; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          Complete your order
        </a>
      </p>
    `),
  });
}

export async function sendBackInStockEmail(email: string, product: Product): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Back in stock: ${product.name}`,
    html: emailShell(`
      <p>Good news — <strong>${product.name}</strong> is back in stock!</p>
      <p style="margin: 16px 0;">
        <a href="${siteUrl}/product/${product.slug}"
           style="background: #7a1f2b; color: #faf6ee; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          Shop now
        </a>
      </p>
      <p>Only ${product.stock} left, so it may sell out again quickly.</p>
    `),
  });
}
