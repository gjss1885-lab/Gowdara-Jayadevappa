import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { isSupabaseAdminConfigured } from "@/lib/config";
import type {
  AbandonedCart,
  Address,
  AddressInput,
  Banner,
  BannerInput,
  BannerPatch,
  Category,
  CategoryInput,
  CategoryPatch,
  NewsletterSubscriber,
  Order,
  OrderItem,
  Product,
  RatingSummary,
  Review,
  ReviewInput,
  StockNotification,
} from "@/lib/types";
import * as local from "@/lib/local-db";
import * as remote from "@/lib/supabase/queries";

// Single data-access surface used by every page/route in the app.
// - If Supabase admin credentials are set, reads/writes go to Supabase.
// - Otherwise everything falls back to a local JSON file (lib/local-db.ts)
//   seeded from lib/seed-data.ts, so the site runs with zero accounts.
//
// This means the moment you add Supabase env vars, the whole app (catalog
// + orders) switches over automatically -- nothing else has to change.

const useSupabase = isSupabaseAdminConfigured;

// Catalog reads (categories/banners/products/rating summaries) are hit on
// every storefront page view -- home, shop, and product pages all fetch
// straight from Supabase on every single request, which is the main reason
// pages felt slow and the main thing that would make heavier traffic hurt
// (every visitor is a fresh round trip, all the way to the database, with
// nothing cached in between). unstable_cache keeps a short-lived (60s),
// tagged copy in Next's own cache -- most page views are served from that
// instead of hitting Supabase at all, and an admin edit still shows up
// immediately (rather than waiting up to 60s) because the write routes
// below call revalidateTag() right after saving, which clears the cache
// early. Reviews/orders/addresses/etc. are intentionally NOT cached here --
// those are either personalized per visitor (so caching them wouldn't help)
// or need to always be exactly correct (order status).
const CATALOG_REVALIDATE_SECONDS = 60;

export async function getCategories(): Promise<Category[]> {
  return unstable_cache(
    async () => (useSupabase ? remote.supabaseGetCategories() : local.localGetCategories()),
    ["categories:list"],
    { revalidate: CATALOG_REVALIDATE_SECONDS, tags: ["categories"] }
  )();
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const category = useSupabase
    ? await remote.supabaseCreateCategory(input)
    : await local.localCreateCategory(input);
  revalidateTag("categories", { expire: 0 });
  return category;
}

export async function updateCategory(id: string, patch: CategoryPatch): Promise<Category | undefined> {
  const category = useSupabase
    ? await remote.supabaseUpdateCategory(id, patch)
    : await local.localUpdateCategory(id, patch);
  revalidateTag("categories", { expire: 0 });
  return category;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const result = useSupabase ? await remote.supabaseDeleteCategory(id) : await local.localDeleteCategory(id);
  revalidateTag("categories", { expire: 0 });
  return result;
}

// --- Homepage banners ---

export async function getBanners(): Promise<Banner[]> {
  return unstable_cache(
    async () => (useSupabase ? remote.supabaseGetBanners() : local.localGetBanners()),
    ["banners:list"],
    { revalidate: CATALOG_REVALIDATE_SECONDS, tags: ["banners"] }
  )();
}

export async function createBanner(input: BannerInput): Promise<Banner> {
  const banner = useSupabase ? await remote.supabaseCreateBanner(input) : await local.localCreateBanner(input);
  revalidateTag("banners", { expire: 0 });
  return banner;
}

export async function updateBanner(id: string, patch: BannerPatch): Promise<Banner | undefined> {
  const banner = useSupabase
    ? await remote.supabaseUpdateBanner(id, patch)
    : await local.localUpdateBanner(id, patch);
  revalidateTag("banners", { expire: 0 });
  return banner;
}

export async function deleteBanner(id: string): Promise<boolean> {
  const result = useSupabase ? await remote.supabaseDeleteBanner(id) : await local.localDeleteBanner(id);
  revalidateTag("banners", { expire: 0 });
  return result;
}

export async function listProducts(): Promise<Product[]> {
  return unstable_cache(
    async () => (useSupabase ? remote.supabaseListProducts() : local.localListProducts()),
    ["products:list"],
    { revalidate: CATALOG_REVALIDATE_SECONDS, tags: ["products"] }
  )();
}

export async function getProduct(slugOrId: string): Promise<Product | undefined> {
  return unstable_cache(
    async () => (useSupabase ? remote.supabaseGetProduct(slugOrId) : local.localGetProduct(slugOrId)),
    [`products:get:${slugOrId}`],
    { revalidate: CATALOG_REVALIDATE_SECONDS, tags: ["products"] }
  )();
}

export async function createProduct(
  input: Omit<Product, "id" | "createdAt">
): Promise<Product> {
  const product = useSupabase
    ? await remote.supabaseCreateProduct(input)
    : await local.localCreateProduct(input);
  revalidateTag("products", { expire: 0 });
  return product;
}

export async function updateProduct(
  id: string,
  patch: Partial<Omit<Product, "id" | "createdAt">>
): Promise<Product | undefined> {
  const product = useSupabase
    ? await remote.supabaseUpdateProduct(id, patch)
    : await local.localUpdateProduct(id, patch);
  revalidateTag("products", { expire: 0 });
  return product;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const result = useSupabase ? await remote.supabaseDeleteProduct(id) : await local.localDeleteProduct(id);
  revalidateTag("products", { expire: 0 });
  return result;
}

export async function listOrders(): Promise<Order[]> {
  return useSupabase ? remote.supabaseListOrders() : local.localListOrders();
}

export async function getOrder(id: string): Promise<Order | undefined> {
  return useSupabase ? remote.supabaseGetOrder(id) : local.localGetOrder(id);
}

export async function createOrder(input: Omit<Order, "id" | "createdAt">): Promise<Order> {
  return useSupabase ? remote.supabaseCreateOrder(input) : local.localCreateOrder(input);
}

export async function updateOrder(id: string, patch: Partial<Order>): Promise<Order | undefined> {
  return useSupabase ? remote.supabaseUpdateOrder(id, patch) : local.localUpdateOrder(id, patch);
}

// --- Reviews ---

export async function listReviews(productId: string): Promise<Review[]> {
  return useSupabase ? remote.supabaseListReviews(productId) : local.localListReviews(productId);
}

export async function createReview(
  input: ReviewInput & { verifiedPurchase: boolean }
): Promise<Review> {
  const review = useSupabase
    ? await remote.supabaseCreateReview(input)
    : await local.localCreateReview(input);
  // listReviews() itself isn't cached (a product's own review list is read
  // far less often than the catalog, and reviewers rightly expect to see
  // their own submission immediately) -- only the rating-summary numbers
  // shown on product cards elsewhere are, so that's what needs clearing.
  revalidateTag("reviews", { expire: 0 });
  return review;
}

// Every review across every product -- used only by the admin backup
// export (src/app/api/admin/backup/route.ts).
export async function listAllReviews(): Promise<Review[]> {
  return useSupabase ? remote.supabaseListAllReviews() : local.localListAllReviews();
}

export async function getRatingSummaries(
  productIds: string[]
): Promise<Record<string, RatingSummary>> {
  if (productIds.length === 0) return {};
  const sortedIds = [...productIds].sort();
  return unstable_cache(
    async () =>
      useSupabase
        ? remote.supabaseGetRatingSummaries(sortedIds)
        : local.localGetRatingSummaries(sortedIds),
    [`reviews:summaries:${sortedIds.join(",")}`],
    { revalidate: CATALOG_REVALIDATE_SECONDS, tags: ["reviews"] }
  )();
}

// --- Stock notifications ---

export async function createStockNotification(
  productId: string,
  email: string
): Promise<StockNotification> {
  return useSupabase
    ? remote.supabaseCreateStockNotification(productId, email)
    : local.localCreateStockNotification(productId, email);
}

// Every stock notification signup -- used only by the admin backup export.
export async function listAllStockNotifications(): Promise<StockNotification[]> {
  return useSupabase
    ? remote.supabaseListAllStockNotifications()
    : local.localListAllStockNotifications();
}

export async function getPendingStockNotifications(productId: string): Promise<StockNotification[]> {
  return useSupabase
    ? remote.supabaseGetPendingStockNotifications(productId)
    : local.localGetPendingStockNotifications(productId);
}

export async function markStockNotificationsNotified(ids: string[]): Promise<void> {
  return useSupabase
    ? remote.supabaseMarkStockNotificationsNotified(ids)
    : local.localMarkStockNotificationsNotified(ids);
}

// --- Saved addresses (Supabase-only -- there's no concept of "an account"
// without it, same gate the account page itself already uses) ---

export async function listAddresses(userId: string): Promise<Address[]> {
  return remote.supabaseListAddresses(userId);
}

// Every saved address across every customer -- used only by the admin
// backup export. Returns an empty array on the local (no-Supabase) backend
// since addresses don't exist there at all.
export async function listAllAddresses(): Promise<Address[]> {
  return useSupabase ? remote.supabaseListAllAddresses() : [];
}

export async function createAddress(userId: string, input: AddressInput): Promise<Address> {
  return remote.supabaseCreateAddress(userId, input);
}

export async function deleteAddress(userId: string, id: string): Promise<boolean> {
  return remote.supabaseDeleteAddress(userId, id);
}

export async function setDefaultAddress(userId: string, id: string): Promise<void> {
  return remote.supabaseSetDefaultAddress(userId, id);
}

// --- Newsletter (works on both backends -- no login required to subscribe) ---

export async function createNewsletterSubscriber(email: string): Promise<NewsletterSubscriber> {
  return useSupabase
    ? remote.supabaseCreateNewsletterSubscriber(email)
    : local.localCreateNewsletterSubscriber(email);
}

export async function listNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  return useSupabase
    ? remote.supabaseListNewsletterSubscribers()
    : local.localListNewsletterSubscribers();
}

// --- Abandoned carts (Supabase-only -- same reasoning as saved addresses:
// there's no "account" to snapshot a cart against without it) ---

export async function upsertAbandonedCartSnapshot(
  userId: string,
  email: string,
  items: OrderItem[],
  subtotal: number
): Promise<void> {
  return remote.supabaseUpsertAbandonedCartSnapshot(userId, email, items, subtotal);
}

export async function clearAbandonedCartSnapshot(userId: string): Promise<void> {
  return remote.supabaseClearAbandonedCartSnapshot(userId);
}

export async function listStaleAbandonedCarts(cutoffIso: string): Promise<AbandonedCart[]> {
  return useSupabase ? remote.supabaseListStaleAbandonedCarts(cutoffIso) : [];
}

export async function markAbandonedCartsReminded(ids: string[]): Promise<void> {
  return remote.supabaseMarkAbandonedCartsReminded(ids);
}

export const dataBackend = useSupabase ? "supabase" : "local";
