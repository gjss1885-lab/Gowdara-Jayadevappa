import "server-only";
import { createSupabaseAdminClient } from "./admin";
import type {
  AbandonedCart,
  Address,
  AddressInput,
  Category,
  CategoryInput,
  CategoryPatch,
  NewsletterSubscriber,
  Order,
  OrderItem,
  Product,
  Review,
  ReviewInput,
  StockNotification,
} from "@/lib/types";

// Supabase-backed implementation of the same operations local-db.ts
// provides. lib/db.ts picks this automatically once Supabase env vars are
// set (see .env.local.example and supabase/schema.sql for the table
// definitions these queries expect).

function rowToProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    category: row.category as string,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : null,
    description: row.description as string,
    fabric: row.fabric as string,
    color: row.color as string,
    stock: Number(row.stock),
    featured: Boolean(row.featured),
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    createdAt: row.created_at as string,
  };
}

function productToRow(input: Omit<Product, "id" | "createdAt">) {
  return {
    slug: input.slug,
    name: input.name,
    category: input.category,
    price: input.price,
    compare_at_price: input.compareAtPrice ?? null,
    description: input.description,
    fabric: input.fabric,
    color: input.color,
    stock: input.stock,
    featured: Boolean(input.featured),
    images: input.images ?? [],
  };
}

function rowToOrder(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    items: row.items as Order["items"],
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    total: Number(row.total),
    customerName: row.customer_name as string,
    email: row.email as string,
    phone: row.phone as string,
    address: row.address as string,
    city: row.city as string,
    state: row.state as string,
    pincode: row.pincode as string,
    paymentMethod: row.payment_method as Order["paymentMethod"],
    status: row.status as Order["status"],
    razorpayOrderId: (row.razorpay_order_id as string) ?? null,
    razorpayPaymentId: (row.razorpay_payment_id as string) ?? null,
    razorpayRefundId: (row.razorpay_refund_id as string) ?? null,
    refundStatus: (row.refund_status as Order["refundStatus"]) ?? "none",
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

function rowToReview(row: Record<string, unknown>): Review {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    authorName: row.author_name as string,
    email: row.email as string,
    rating: Number(row.rating),
    title: (row.title as string) ?? undefined,
    body: row.body as string,
    verifiedPurchase: Boolean(row.verified_purchase),
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    createdAt: row.created_at as string,
  };
}

function rowToStockNotification(row: Record<string, unknown>): StockNotification {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    email: row.email as string,
    notifiedAt: (row.notified_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToNewsletterSubscriber(row: Record<string, unknown>): NewsletterSubscriber {
  return {
    id: row.id as string,
    email: row.email as string,
    createdAt: row.created_at as string,
  };
}

function rowToAbandonedCart(row: Record<string, unknown>): AbandonedCart {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    email: row.email as string,
    items: row.items as OrderItem[],
    subtotal: Number(row.subtotal),
    remindedAt: (row.reminded_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToAddress(row: Record<string, unknown>): Address {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    label: (row.label as string) ?? undefined,
    customerName: row.customer_name as string,
    phone: row.phone as string,
    address: row.address as string,
    city: row.city as string,
    state: row.state as string,
    pincode: row.pincode as string,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at as string,
  };
}

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: row.description as string,
    image: (row.image_url as string | null) ?? null,
  };
}

export async function supabaseGetCategories(): Promise<Category[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToCategory);
}

export async function supabaseCreateCategory(input: CategoryInput): Promise<Category> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      slug: input.slug,
      name: input.name,
      description: input.description,
      image_url: input.image ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return rowToCategory(data);
}

export async function supabaseUpdateCategory(
  id: string,
  patch: CategoryPatch
): Promise<Category | undefined> {
  const supabase = createSupabaseAdminClient();
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.image !== undefined) row.image_url = patch.image;

  const { data, error } = await supabase
    .from("categories")
    .update(row)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data ? rowToCategory(data) : undefined;
}

export async function supabaseDeleteCategory(id: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function supabaseListProducts(): Promise<Product[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToProduct);
}

export async function supabaseGetProduct(slugOrId: string): Promise<Product | undefined> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToProduct(data) : undefined;
}

export async function supabaseCreateProduct(
  input: Omit<Product, "id" | "createdAt">
): Promise<Product> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .insert(productToRow(input))
    .select("*")
    .single();
  if (error) throw error;
  return rowToProduct(data);
}

export async function supabaseUpdateProduct(
  id: string,
  patch: Partial<Omit<Product, "id" | "createdAt">>
): Promise<Product | undefined> {
  const supabase = createSupabaseAdminClient();
  const row: Record<string, unknown> = {};
  if (patch.slug !== undefined) row.slug = patch.slug;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.price !== undefined) row.price = patch.price;
  if (patch.compareAtPrice !== undefined) row.compare_at_price = patch.compareAtPrice;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.fabric !== undefined) row.fabric = patch.fabric;
  if (patch.color !== undefined) row.color = patch.color;
  if (patch.stock !== undefined) row.stock = patch.stock;
  if (patch.featured !== undefined) row.featured = patch.featured;
  if (patch.images !== undefined) row.images = patch.images;

  const { data, error } = await supabase
    .from("products")
    .update(row)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data ? rowToProduct(data) : undefined;
}

export async function supabaseDeleteProduct(id: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function supabaseListOrders(): Promise<Order[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToOrder);
}

export async function supabaseGetOrder(id: string): Promise<Order | undefined> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToOrder(data) : undefined;
}

export async function supabaseCreateOrder(input: Omit<Order, "id" | "createdAt">): Promise<Order> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      items: input.items,
      subtotal: input.subtotal,
      shipping: input.shipping,
      total: input.total,
      customer_name: input.customerName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      payment_method: input.paymentMethod,
      status: input.status,
      razorpay_order_id: input.razorpayOrderId ?? null,
      razorpay_payment_id: input.razorpayPaymentId ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;

  // Best-effort stock decrement (not run in a transaction; fine for a
  // small shop, revisit with a Postgres function if you need strict
  // consistency under concurrent orders).
  for (const item of input.items) {
    const { data: product } = await supabase
      .from("products")
      .select("stock")
      .eq("id", item.productId)
      .maybeSingle();
    if (product) {
      await supabase
        .from("products")
        .update({ stock: Math.max(0, Number(product.stock) - item.quantity) })
        .eq("id", item.productId);
    }
  }

  return rowToOrder(data);
}

export async function supabaseUpdateOrder(
  id: string,
  patch: Partial<Order>
): Promise<Order | undefined> {
  const supabase = createSupabaseAdminClient();
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.razorpayOrderId !== undefined) row.razorpay_order_id = patch.razorpayOrderId;
  if (patch.razorpayPaymentId !== undefined) row.razorpay_payment_id = patch.razorpayPaymentId;
  if (patch.razorpayRefundId !== undefined) row.razorpay_refund_id = patch.razorpayRefundId;
  if (patch.refundStatus !== undefined) row.refund_status = patch.refundStatus;

  const { data, error } = await supabase
    .from("orders")
    .update(row)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data ? rowToOrder(data) : undefined;
}

// --- Reviews ---

export async function supabaseListReviews(productId: string): Promise<Review[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToReview);
}

// Every review across every product -- used only by the admin backup
// export, which needs the full table rather than one product's reviews.
export async function supabaseListAllReviews(): Promise<Review[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToReview);
}

export async function supabaseCreateReview(
  input: ReviewInput & { verifiedPurchase: boolean }
): Promise<Review> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      product_id: input.productId,
      author_name: input.authorName,
      email: input.email,
      rating: input.rating,
      title: input.title ?? null,
      body: input.body,
      verified_purchase: input.verifiedPurchase,
      images: input.images ?? [],
    })
    .select("*")
    .single();
  if (error) throw error;
  return rowToReview(data);
}

// Aggregated client-side rather than via a Postgres group-by -- simplest
// thing that works at a small shop's review volume.
export async function supabaseGetRatingSummaries(
  productIds: string[]
): Promise<Record<string, { average: number; count: number }>> {
  if (productIds.length === 0) return {};
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("product_id, rating")
    .in("product_id", productIds);
  if (error) throw error;

  const totals: Record<string, { total: number; count: number }> = {};
  for (const row of data ?? []) {
    const productId = row.product_id as string;
    const entry = totals[productId] ?? { total: 0, count: 0 };
    entry.total += Number(row.rating);
    entry.count += 1;
    totals[productId] = entry;
  }
  const result: Record<string, { average: number; count: number }> = {};
  for (const [productId, { total, count }] of Object.entries(totals)) {
    result[productId] = { average: total / count, count };
  }
  return result;
}

// --- Stock notifications ---

// Every stock notification signup, pending or already notified -- used
// only by the admin backup export.
export async function supabaseListAllStockNotifications(): Promise<StockNotification[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("stock_notifications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToStockNotification);
}

export async function supabaseCreateStockNotification(
  productId: string,
  email: string
): Promise<StockNotification> {
  const supabase = createSupabaseAdminClient();
  const { data: existing } = await supabase
    .from("stock_notifications")
    .select("*")
    .eq("product_id", productId)
    .ilike("email", email)
    .is("notified_at", null)
    .maybeSingle();
  if (existing) return rowToStockNotification(existing);

  const { data, error } = await supabase
    .from("stock_notifications")
    .insert({ product_id: productId, email })
    .select("*")
    .single();
  if (error) throw error;
  return rowToStockNotification(data);
}

export async function supabaseGetPendingStockNotifications(
  productId: string
): Promise<StockNotification[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("stock_notifications")
    .select("*")
    .eq("product_id", productId)
    .is("notified_at", null);
  if (error) throw error;
  return (data ?? []).map(rowToStockNotification);
}

export async function supabaseMarkStockNotificationsNotified(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("stock_notifications")
    .update({ notified_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw error;
}

// --- Saved addresses ---

// Every saved address across every customer -- used only by the admin
// backup export, which needs the full table rather than one user's slice.
export async function supabaseListAllAddresses(): Promise<Address[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToAddress);
}

export async function supabaseListAddresses(userId: string): Promise<Address[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToAddress);
}

export async function supabaseCreateAddress(
  userId: string,
  input: AddressInput
): Promise<Address> {
  const supabase = createSupabaseAdminClient();
  // A newly-added first address becomes the default automatically.
  const { count } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const makeDefault = input.isDefault || !count;

  if (makeDefault) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      user_id: userId,
      label: input.label ?? null,
      customer_name: input.customerName,
      phone: input.phone,
      address: input.address,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      is_default: makeDefault,
    })
    .select("*")
    .single();
  if (error) throw error;
  return rowToAddress(data);
}

export async function supabaseDeleteAddress(userId: string, id: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("addresses").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
  return true;
}

export async function supabaseSetDefaultAddress(userId: string, id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

// --- Newsletter ---

export async function supabaseCreateNewsletterSubscriber(email: string): Promise<NewsletterSubscriber> {
  const supabase = createSupabaseAdminClient();
  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .ilike("email", email)
    .maybeSingle();
  if (existing) return rowToNewsletterSubscriber(existing);

  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email })
    .select("*")
    .single();
  if (error) throw error;
  return rowToNewsletterSubscriber(data);
}

// Used by the admin newsletter page (list + CSV export).
export async function supabaseListNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToNewsletterSubscriber);
}

// --- Abandoned carts (Supabase-only -- there's no concept of "an account"
// to tie a snapshot to without it, same gate saved addresses use) ---

export async function supabaseUpsertAbandonedCartSnapshot(
  userId: string,
  email: string,
  items: OrderItem[],
  subtotal: number
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  // A fresh checkout visit replaces any previous snapshot for this
  // customer and resets reminded_at -- a changed cart deserves its own
  // reminder window, not silence because an older cart already got emailed.
  const { error } = await supabase.from("abandoned_carts").upsert(
    {
      user_id: userId,
      email,
      items,
      subtotal,
      reminded_at: null,
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

export async function supabaseClearAbandonedCartSnapshot(userId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("abandoned_carts").delete().eq("user_id", userId);
  if (error) throw error;
}

// Snapshots older than `cutoffIso` that haven't been emailed yet -- what
// the cron endpoint (src/app/api/cron/abandoned-carts/route.ts) reminds.
export async function supabaseListStaleAbandonedCarts(cutoffIso: string): Promise<AbandonedCart[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("abandoned_carts")
    .select("*")
    .is("reminded_at", null)
    .lt("created_at", cutoffIso);
  if (error) throw error;
  return (data ?? []).map(rowToAbandonedCart);
}

export async function supabaseMarkAbandonedCartsReminded(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("abandoned_carts")
    .update({ reminded_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw error;
}
