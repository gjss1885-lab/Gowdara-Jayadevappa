export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  // Cover photo shown on the homepage "Shop by Category" tiles and the
  // shop page. Same storage pattern as Product.images (Supabase Storage,
  // or a local uploads folder without Supabase) -- null/missing falls back
  // to a styled placeholder (see components/ProductImage.tsx).
  image?: string | null;
};

// The slug is deliberately left out of updates once a category exists --
// it's what products' `category` field is matched against (see
// order-match-style joins throughout the app), so changing it after the
// fact would silently disconnect existing products from this category.
export type CategoryInput = Omit<Category, "id">;
export type CategoryPatch = Partial<Pick<Category, "name" | "description" | "image">>;

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string; // category slug
  price: number; // in INR, whole rupees
  compareAtPrice?: number | null;
  description: string;
  fabric: string;
  color: string;
  stock: number;
  featured?: boolean;
  // Photo URLs, in display order -- the first one is the cover photo shown
  // on product cards and the cart. Empty/missing means no real photo has
  // been uploaded yet, so a styled placeholder is shown instead.
  images?: string[];
  createdAt: string;
};

export type ProductInput = Omit<Product, "id" | "createdAt">;

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type OrderStatus =
  | "pending_payment"
  | "confirmed"
  | "cancellation_requested"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "razorpay" | "cod";

export type RefundStatus = "none" | "processing" | "refunded" | "failed";

export type Order = {
  id: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpayRefundId?: string | null;
  refundStatus?: RefundStatus;
  notes?: string;
  createdAt: string;
};

export type OrderInput = Omit<Order, "id" | "createdAt" | "status"> & {
  status?: OrderStatus;
};

export type Review = {
  id: string;
  productId: string;
  authorName: string;
  email: string;
  rating: number; // 1-5
  title?: string;
  body: string;
  verifiedPurchase: boolean;
  // Photo URLs the reviewer attached, in upload order. Same storage
  // pattern as Product.images (Supabase Storage bucket, or a local
  // uploads folder when Supabase isn't configured).
  images?: string[];
  createdAt: string;
};

export type ReviewInput = {
  productId: string;
  authorName: string;
  email: string;
  rating: number;
  title?: string;
  body: string;
  images?: string[];
};

export type RatingSummary = {
  average: number;
  count: number;
};

export type StockNotification = {
  id: string;
  productId: string;
  email: string;
  notifiedAt?: string | null;
  createdAt: string;
};

// A customer's saved shipping address (requires Supabase login -- there's
// no concept of "an account" without it). Field names deliberately mirror
// the checkout form / Order shape so an address can be spread straight
// into it as a prefill.
export type Address = {
  id: string;
  userId: string;
  label?: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt: string;
};

export type AddressInput = Omit<Address, "id" | "userId" | "createdAt">;

// A footer newsletter signup. Deliberately just an address list, not a
// full marketing-email platform -- see src/lib/db.ts for how it's read.
export type NewsletterSubscriber = {
  id: string;
  email: string;
  createdAt: string;
};

// A snapshot of a logged-in customer's cart taken when they load the
// checkout page, used to send an "you left something in your cart" email
// if they never actually complete the order. Reuses OrderItem's shape
// since it's the same "productId/name/price/quantity" data either way.
// One row per user (a new checkout visit overwrites the previous
// snapshot); remindedAt is set once the reminder email has gone out, so
// the same abandoned cart isn't emailed twice.
export type AbandonedCart = {
  id: string;
  userId: string;
  email: string;
  items: OrderItem[];
  subtotal: number;
  remindedAt?: string | null;
  createdAt: string;
};
