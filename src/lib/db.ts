import "server-only";
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

export async function getCategories(): Promise<Category[]> {
  return useSupabase ? remote.supabaseGetCategories() : local.localGetCategories();
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  return useSupabase ? remote.supabaseCreateCategory(input) : local.localCreateCategory(input);
}

export async function updateCategory(id: string, patch: CategoryPatch): Promise<Category | undefined> {
  return useSupabase
    ? remote.supabaseUpdateCategory(id, patch)
    : local.localUpdateCategory(id, patch);
}

export async function deleteCategory(id: string): Promise<boolean> {
  return useSupabase ? remote.supabaseDeleteCategory(id) : local.localDeleteCategory(id);
}

// --- Homepage banners ---

export async function getBanners(): Promise<Banner[]> {
  return useSupabase ? remote.supabaseGetBanners() : local.localGetBanners();
}

export async function createBanner(input: BannerInput): Promise<Banner> {
  return useSupabase ? remote.supabaseCreateBanner(input) : local.localCreateBanner(input);
}

export async function updateBanner(id: string, patch: BannerPatch): Promise<Banner | undefined> {
  return useSupabase ? remote.supabaseUpdateBanner(id, patch) : local.localUpdateBanner(id, patch);
}

export async function deleteBanner(id: string): Promise<boolean> {
  return useSupabase ? remote.supabaseDeleteBanner(id) : local.localDeleteBanner(id);
}

export async function listProducts(): Promise<Product[]> {
  return useSupabase ? remote.supabaseListProducts() : local.localListProducts();
}

export async function getProduct(slugOrId: string): Promise<Product | undefined> {
  return useSupabase ? remote.supabaseGetProduct(slugOrId) : local.localGetProduct(slugOrId);
}

export async function createProduct(
  input: Omit<Product, "id" | "createdAt">
): Promise<Product> {
  return useSupabase ? remote.supabaseCreateProduct(input) : local.localCreateProduct(input);
}

export async function updateProduct(
  id: string,
  patch: Partial<Omit<Product, "id" | "createdAt">>
): Promise<Product | undefined> {
  return useSupabase
    ? remote.supabaseUpdateProduct(id, patch)
    : local.localUpdateProduct(id, patch);
}

export async function deleteProduct(id: string): Promise<boolean> {
  return useSupabase ? remote.supabaseDeleteProduct(id) : local.localDeleteProduct(id);
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
  return useSupabase ? remote.supabaseCreateReview(input) : local.localCreateReview(input);
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
  return useSupabase
    ? remote.supabaseGetRatingSummaries(productIds)
    : local.localGetRatingSummaries(productIds);
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
