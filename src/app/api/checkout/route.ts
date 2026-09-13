import { NextResponse } from "next/server";
import { clearAbandonedCartSnapshot, createOrder, getProduct, updateOrder } from "@/lib/db";
import { createRazorpayOrder } from "@/lib/razorpay";
import { sendAdminNewOrderEmail, sendOrderConfirmationEmail } from "@/lib/notifications";
import {
  isRazorpayConfigured,
  isSupabaseConfigured,
  siteConfig,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING,
} from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { withApiErrorHandling } from "@/lib/api-utils";
import type { DeliveryMethod, OrderItem, PaymentMethod } from "@/lib/types";

type CheckoutBody = {
  items: { productId: string; quantity: number }[];
  customerName: string;
  email: string;
  phone: string;
  // Only required when deliveryMethod is "delivery" -- a pickup order
  // still gets these fields (see below), just filled in with the shop's
  // own address rather than something the customer typed.
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  deliveryMethod?: DeliveryMethod;
  paymentMethod: PaymentMethod;
};

export const POST = withApiErrorHandling(async (request: Request) => {
  // The /checkout page already redirects a logged-out visitor to /login,
  // but that's only a UI nicety -- someone could still POST here directly.
  // This is the actual enforcement point. Only checked once Supabase login
  // is configured, same as the page-level redirect, so local/dev mode
  // (no way to log in at all) doesn't turn into a dead end.
  let loggedInUserId: string | null = null;
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (!user) {
      return NextResponse.json(
        { error: "Please log in before checking out.", requiresLogin: true },
        { status: 401 }
      );
    }
    loggedInUserId = user.id;
  }

  const body = (await request.json()) as CheckoutBody;
  const isPickup = body.deliveryMethod === "pickup";

  if (!body.items?.length) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }
  // A pickup order still needs a name/email/phone to reach the customer
  // when it's ready, but there's nowhere to ship it, so the address
  // fields aren't required in that case.
  const requiredFields = isPickup
    ? (["customerName", "email", "phone"] as const)
    : (["customerName", "email", "phone", "address", "city", "state", "pincode"] as const);
  for (const field of requiredFields) {
    if (!body[field]?.trim()) {
      return NextResponse.json({ error: `Please fill in ${field}.` }, { status: 400 });
    }
  }

  // Re-price server-side from the catalog rather than trusting client prices,
  // and re-check stock too -- the cart's cached figure can be stale by the
  // time someone actually checks out.
  const orderItems: OrderItem[] = [];
  for (const line of body.items) {
    const product = await getProduct(line.productId);
    if (!product) {
      return NextResponse.json({ error: "One of the items is no longer available." }, { status: 400 });
    }
    const quantity = Math.max(1, Math.floor(line.quantity) || 1);
    if (product.stock <= 0) {
      return NextResponse.json(
        { error: `${product.name} just sold out. Please remove it from your cart.` },
        { status: 400 }
      );
    }
    if (quantity > product.stock) {
      return NextResponse.json(
        {
          error: `Only ${product.stock} of ${product.name} left in stock. Please update the quantity in your cart.`,
        },
        { status: 400 }
      );
    }
    orderItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
    });
  }

  const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  // Nothing to ship on a pickup order, so no shipping fee either way.
  const shipping = isPickup ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
  const total = subtotal + shipping;

  const wantsOnlinePayment = body.paymentMethod === "razorpay";
  const useRazorpay = wantsOnlinePayment && isRazorpayConfigured;

  const order = await createOrder({
    userId: loggedInUserId,
    items: orderItems,
    subtotal,
    shipping,
    total,
    customerName: body.customerName,
    email: body.email,
    phone: body.phone,
    // For pickup, these still hold a value (every order has one, same
    // shape either way) -- the shop's own address, so anything that
    // displays an order's address without pickup-awareness (a CSV export,
    // say) still shows something sensible rather than blank fields.
    address: isPickup ? siteConfig.address : body.address!,
    city: isPickup ? "Pickup at shop" : body.city!,
    state: isPickup ? "" : body.state!,
    pincode: isPickup ? "" : body.pincode!,
    deliveryMethod: isPickup ? "pickup" : "delivery",
    paymentMethod: useRazorpay ? "razorpay" : "cod",
    status: useRazorpay ? "pending_payment" : "confirmed",
    notes: wantsOnlinePayment && !isRazorpayConfigured
      ? "Customer selected online payment, but Razorpay isn't connected yet — treated as Cash on Delivery."
      : undefined,
  });

  // They've placed an order (even if a Razorpay payment is still pending
  // verification), so this cart is no longer "abandoned" -- clear the
  // snapshot so the reminder cron doesn't email them about a cart they've
  // already acted on. Best-effort: never let this fail the actual order.
  if (loggedInUserId) {
    await clearAbandonedCartSnapshot(loggedInUserId).catch((err) =>
      console.error("Failed to clear abandoned-cart snapshot:", err)
    );
  }

  if (!useRazorpay) {
    // COD orders are confirmed immediately, so the confirmation email goes
    // out right away. Razorpay orders wait until /api/checkout/verify
    // confirms the payment actually went through.
    await sendOrderConfirmationEmail(order).catch((err) =>
      console.error("Order confirmation email failed:", err)
    );
    await sendAdminNewOrderEmail(order).catch((err) =>
      console.error("Admin new-order alert failed:", err)
    );
    return NextResponse.json({ orderId: order.id, razorpay: null });
  }

  try {
    const razorpayOrder = await createRazorpayOrder(total, order.id);
    // Recorded now, not just returned to the client -- /api/checkout/verify
    // checks the razorpay_order_id it receives back against this stored
    // value before trusting a payment signature, so a signature from a
    // *different*, already-paid Razorpay order can't be replayed to mark
    // this (possibly more expensive) order as paid instead.
    await updateOrder(order.id, { razorpayOrderId: razorpayOrder.id });
    return NextResponse.json({
      orderId: order.id,
      razorpay: {
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not start online payment. Please try Cash on Delivery instead.", orderId: order.id },
      { status: 502 }
    );
  }
}, { public: true });
