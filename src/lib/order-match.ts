import type { Order } from "./types";

function last10Digits(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

// Orders aren't stored with a user id (checkout only ever collects an email
// and phone number), so "is this my order" is decided by matching either
// one against the logged-in Supabase user. Shared here so the account page
// and the cancellation-request API can't drift apart on how that match is
// made -- the API doing this check is what keeps one customer from being
// able to cancel another customer's order by guessing an order id.
export function orderBelongsToUser(
  order: Order,
  user: { email?: string | null; phone?: string | null }
): boolean {
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
