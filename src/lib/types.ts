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
  // Display order on the homepage "Shop by Category" tiles and the shop
  // page's category filter pills -- lower shows first. Admin can reorder
  // via the up/down arrows on /admin/categories (see CategoriesTable.tsx),
  // the same swap-two-values approach already used for banners. Ties
  // (e.g. every category still at its default) fall back to a stable
  // sort, which keeps them in creation order.
  sortOrder: number;
};

// The slug is deliberately left out of updates once a category exists --
// it's what products' `category` field is matched against (see
// order-match-style joins throughout the app), so changing it after the
// fact would silently disconnect existing products from this category.
export type CategoryInput = Omit<Category, "id">;
export type CategoryPatch = Partial<Pick<Category, "name" | "description" | "image" | "sortOrder">>;

// A homepage hero photo, managed from /admin/banners. These auto-slide
// behind the homepage's top section -- see components/HeroSlider.tsx. No
// text is ever overlaid on them (the previous heading/tagline/CTA there
// was removed on request, since real photos behind text made the text
// unreadable), so `alt` exists purely for screen-reader accessibility.
export type Banner = {
  id: string;
  image: string;
  alt: string;
  // Lower numbers slide first. Reordered from the admin table's
  // move-up/move-down controls, which swap two banners' sortOrder values.
  sortOrder: number;
};

export type BannerInput = Omit<Banner, "id">;
export type BannerPatch = Partial<Pick<Banner, "image" | "alt" | "sortOrder">>;

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

// "pickup" means the customer collects their order in person at the shop
// instead of having it shipped -- see the checkout form's Delivery/Pickup
// toggle. For a pickup order, address/city/state/pincode below still hold
// a value (the shop's own address, for record-keeping/display
// consistency with every other order) even though nothing is actually
// shipped there, and shipping is always 0.
export type DeliveryMethod = "delivery" | "pickup";

export type Order = {
  id: string;
  // The logged-in customer's Supabase auth id at the time the order was
  // placed, when they were logged in (null for a guest/local-dev
  // checkout). This is the reliable way to match an order to "my orders"
  // on the account page -- see src/lib/order-match.ts. Orders placed
  // before this field existed (or by a logged-out guest) are null here
  // and fall back to matching on email/phone instead.
  userId?: string | null;
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
  deliveryMethod: DeliveryMethod;
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

// A Review with the reviewer's email stripped out -- what's safe to send
// to the browser. listReviews() results get mapped to this (see
// toPublicReview() below) before being handed to the client-side
// ReviewsList component; the raw email is a server-only field used just
// for the "Verified Purchase" match and the admin backup export, and
// should never leave the server in a page's rendered data.
export type PublicReview = Omit<Review, "email">;

export function toPublicReview(review: Review): PublicReview {
  return {
    id: review.id,
    productId: review.productId,
    authorName: review.authorName,
    rating: review.rating,
    title: review.title,
    body: review.body,
    verifiedPurchase: review.verifiedPurchase,
    images: review.images,
    createdAt: review.createdAt,
  };
}

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
