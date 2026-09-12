import type { Order } from "./types";

function last10Digits(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

// Every order placed while logged in now records the customer's Supabase
// user id (see api/checkout/route.ts), which is the reliable way to decide
// "is this my order" -- checking that first means a typo, a different
// casing, or simply typing a different contact email/phone into the
// checkout form than the one the account is logged in with can no longer
// make an order silently vanish from someone's own order history.
// Orders placed before this field existed, or by a logged-out guest, have
// no userId, so those still fall back to matching on email/phone against
// the logged-in Supabase user -- shared here so the account page and the
// cancellation-request API can't drift apart on how that fallback match is
// made (the API doing this check is also what keeps one customer from
// being able to cancel another customer's order by guessing an order id).
export function orderBelongsToUser(
  order: Order,
  user: { id?: string | null; email?: string | null; phone?: string | null }
): boolean {
  if (order.userId && user.id && order.userId === user.id) return true;

  const userPhoneDigits = last10Digits(user.phone);
  const emailMatch = Boolean(user.email) && order.email.toLowerCase() === user.email?.toLowerCase();
  const phoneMatch = Boolean(userPhoneDigits) && last10Digits(order.phone) === userPhoneDigits;
  return emailMatch || phoneMatch;
}

// Powers the "Verified Purchase" badge on reviews: true when this email has
// an order (that actually went through, not a cancelled/pending one)
// containing the product being reviewed.
export function hasPurchasedProduct(orders: Order[], email: string, productId: string): boolean {
  const target = email.trim().toLowerCase();
  if (!target) return false;
  return orders.some(
    (order) =>
      order.email.toLowerCase() === target &&
      ["confirmed", "shipped", "delivered"].includes(order.status) &&
      order.items.some((item) => item.productId === productId)
  );
}
