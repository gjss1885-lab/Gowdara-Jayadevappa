import "server-only";
import fs from "node:fs";
import path from "node:path";
import { categories, seedProducts } from "./seed-data";
import type {
  Category,
  CategoryInput,
  CategoryPatch,
  NewsletterSubscriber,
  Order,
  Product,
  Review,
  ReviewInput,
  StockNotification,
} from "./types";

// A small file-backed JSON store used as the default data layer so the
// storefront and admin panel work immediately, with no external accounts.
// Once Supabase credentials are added (see .env.local.example), lib/db.ts
// automatically switches to the Supabase-backed implementation instead.
//
// This is a development convenience, not a production database: on most
// serverless hosts (including Vercel) the filesystem is read-only/ephemeral
// at runtime, so writes here won't persist across deploys or across
// serverless instances. That's expected — it's meant to carry you from
// "no accounts yet" to "Supabase is connected", not to run the live store.

type DbShape = {
  products: Product[];
  categories: Category[];
  orders: Order[];
  reviews: Review[];
  stockNotifications: StockNotification[];
  newsletterSubscribers: NewsletterSubscriber[];
};

const DB_PATH = path.join(process.cwd(), "data", "local-db.json");

function emptyDb(): DbShape {
  return {
    products: seedProducts,
    categories,
    orders: [],
    reviews: [],
    stockNotifications: [],
    newsletterSubscribers: [],
  };
}

function ensureDb(): DbShape {
  if (!fs.existsSync(DB_PATH)) {
    const initial = emptyDb();
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<DbShape>;
    // Older local-db.json files predate reviews/stockNotifications/
    // categories -- backfill them so existing local installs don't crash.
    return {
      products: parsed.products ?? seedProducts,
      categories: parsed.categories ?? categories,
      orders: parsed.orders ?? [],
      reviews: parsed.reviews ?? [],
      stockNotifications: parsed.stockNotifications ?? [],
      newsletterSubscribers: parsed.newsletterSubscribers ?? [],
    };
  } catch {
    const initial = emptyDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
}

function writeDb(db: DbShape) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function localGetCategories(): Category[] {
  return ensureDb().categories;
}

export function localCreateCategory(input: CategoryInput): Category {
  const db = ensureDb();
  const category: Category = {
    ...input,
    id: `cat-${Date.now().toString(36)}`,
  };
  db.categories.push(category);
  writeDb(db);
  return category;
}

export function localUpdateCategory(id: string, patch: CategoryPatch): Category | undefined {
  const db = ensureDb();
  const idx = db.categories.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  db.categories[idx] = { ...db.categories[idx], ...patch };
  writeDb(db);
  return db.categories[idx];
}

export function localDeleteCategory(id: string): boolean {
  const db = ensureDb();
  const before = db.categories.length;
  db.categories = db.categories.filter((c) => c.id !== id);
  writeDb(db);
  return db.categories.length < before;
}

export function localListProducts(): Product[] {
  return ensureDb().products;
}

export function localGetProduct(slugOrId: string): Product | undefined {
  const db = ensureDb();
  return db.products.find((p) => p.slug === slugOrId || p.id === slugOrId);
}

export function localCreateProduct(input: Omit<Product, "id" | "createdAt">): Product {
  const db = ensureDb();
  const product: Product = {
    ...input,
    id: `p-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };
  db.products.unshift(product);
  writeDb(db);
  return product;
}

export function localUpdateProduct(
  id: string,
  patch: Partial<Omit<Product, "id" | "createdAt">>
): Product | undefined {
  const db = ensureDb();
  const idx = db.products.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  db.products[idx] = { ...db.products[idx], ...patch };
  writeDb(db);
  return db.products[idx];
}

export function localDeleteProduct(id: string): boolean {
  const db = ensureDb();
  const before = db.products.length;
  db.products = db.products.filter((p) => p.id !== id);
  writeDb(db);
  return db.products.length < before;
}

export function localListOrders(): Order[] {
  return ensureDb().orders.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function localGetOrder(id: string): Order | undefined {
  return ensureDb().orders.find((o) => o.id === id);
}

export function localCreateOrder(input: Omit<Order, "id" | "createdAt">): Order {
  const db = ensureDb();
  const order: Order = {
    ...input,
    id: `GJ${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
  };
  db.orders.unshift(order);

  // Decrement stock for demo purposes.
  for (const item of order.items) {
    const product = db.products.find((p) => p.id === item.productId);
    if (product) product.stock = Math.max(0, product.stock - item.quantity);
  }

  writeDb(db);
  return order;
}

export function localUpdateOrder(id: string, patch: Partial<Order>): Order | undefined {
  const db = ensureDb();
  const idx = db.orders.findIndex((o) => o.id === id);
  if (idx === -1) return undefined;
  db.orders[idx] = { ...db.orders[idx], ...patch };
  writeDb(db);
  return db.orders[idx];
}

// --- Reviews ---

export function localListReviews(productId: string): Review[] {
  return ensureDb()
    .reviews.filter((r) => r.productId === productId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// Every review across every product -- used only by the admin backup
// export (src/app/api/admin/backup/route.ts), which needs the full table
// rather than one product's slice of it.
export function localListAllReviews(): Review[] {
  return ensureDb().reviews;
}

export function localCreateReview(
  input: ReviewInput & { verifiedPurchase: boolean }
): Review {
  const db = ensureDb();
  const review: Review = {
    ...input,
    id: `rev-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };
  db.reviews.unshift(review);
  writeDb(db);
  return review;
}

// One aggregate pass over every review rather than a query per product --
// fine at this shop's scale, and keeps the shop grid to a single read.
export function localGetRatingSummaries(
  productIds: string[]
): Record<string, { average: number; count: number }> {
  const db = ensureDb();
  const ids = new Set(productIds);
  const summary: Record<string, { total: number; count: number }> = {};
  for (const review of db.reviews) {
    if (!ids.has(review.productId)) continue;
    const entry = summary[review.productId] ?? { total: 0, count: 0 };
    entry.total += review.rating;
    entry.count += 1;
    summary[review.productId] = entry;
  }
  const result: Record<string, { average: number; count: number }> = {};
  for (const [productId, { total, count }] of Object.entries(summary)) {
    result[productId] = { average: total / count, count };
  }
  return result;
}

// --- Stock notifications ---

export function localCreateStockNotification(productId: string, email: string): StockNotification {
  const db = ensureDb();
  // Don't stack up duplicate pending subscriptions for the same
  // product+email -- just return the existing one.
  const existing = db.stockNotifications.find(
    (n) => n.productId === productId && n.email.toLowerCase() === email.toLowerCase() && !n.notifiedAt
  );
  if (existing) return existing;

  const notification: StockNotification = {
    id: `sn-${Date.now().toString(36)}`,
    productId,
    email,
    notifiedAt: null,
    createdAt: new Date().toISOString(),
  };
  db.stockNotifications.push(notification);
  writeDb(db);
  return notification;
}

export function localGetPendingStockNotifications(productId: string): StockNotification[] {
  return ensureDb().stockNotifications.filter((n) => n.productId === productId && !n.notifiedAt);
}

// Every stock notification signup, pending or already notified -- used
// only by the admin backup export.
export function localListAllStockNotifications(): StockNotification[] {
  return ensureDb().stockNotifications;
}

export function localMarkStockNotificationsNotified(ids: string[]): void {
  const db = ensureDb();
  const idSet = new Set(ids);
  for (const n of db.stockNotifications) {
    if (idSet.has(n.id)) n.notifiedAt = new Date().toISOString();
  }
  writeDb(db);
}

// --- Newsletter ---

export function localCreateNewsletterSubscriber(email: string): NewsletterSubscriber {
  const db = ensureDb();
  // Re-subscribing with the same address is a no-op, not a duplicate row.
  const existing = db.newsletterSubscribers.find(
    (s) => s.email.toLowerCase() === email.toLowerCase()
  );
  if (existing) return existing;

  const subscriber: NewsletterSubscriber = {
    id: `nl-${Date.now().toString(36)}`,
    email,
    createdAt: new Date().toISOString(),
  };
  db.newsletterSubscribers.push(subscriber);
  writeDb(db);
  return subscriber;
}

// Used by the admin newsletter page (list + CSV export).
export function localListNewsletterSubscribers(): NewsletterSubscriber[] {
  return ensureDb()
    .newsletterSubscribers.slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
