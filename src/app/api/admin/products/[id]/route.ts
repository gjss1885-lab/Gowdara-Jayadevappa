import { NextResponse } from "next/server";
import {
  deleteProduct,
  getPendingStockNotifications,
  getProduct,
  markStockNotificationsNotified,
  updateProduct,
} from "@/lib/db";
import { withApiErrorHandling } from "@/lib/api-utils";
import { sendBackInStockEmail } from "@/lib/notifications";
import type { Product, ProductInput } from "@/lib/types";

// Fires "back in stock" emails to everyone still waiting when a restock
// crosses 0 -> positive. Failures here are logged, not thrown -- a broken
// email provider shouldn't stop the admin from actually saving the stock
// count.
async function notifyIfRestocked(before: Product | undefined, after: Product | undefined) {
  if (!before || !after) return;
  if (before.stock > 0 || after.stock <= 0) return;

  try {
    const pending = await getPendingStockNotifications(after.id);
    if (pending.length === 0) return;
    await Promise.all(pending.map((n) => sendBackInStockEmail(n.email, after)));
    await markStockNotificationsNotified(pending.map((n) => n.id));
  } catch (error) {
    console.error("Back-in-stock notification failed:", error);
  }
}

export const PATCH = withApiErrorHandling(async (
  request: Request,
  { params }: RouteContext<"/api/admin/products/[id]">
) => {
  const { id } = await params;
  const body = (await request.json()) as Partial<ProductInput>;

  const patch: Partial<ProductInput> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.slug !== undefined) patch.slug = body.slug;
  if (body.category !== undefined) patch.category = body.category;
  if (body.price !== undefined) patch.price = Number(body.price);
  if (body.compareAtPrice !== undefined)
    patch.compareAtPrice = body.compareAtPrice ? Number(body.compareAtPrice) : null;
  if (body.description !== undefined) patch.description = body.description;
  if (body.fabric !== undefined) patch.fabric = body.fabric;
  if (body.color !== undefined) patch.color = body.color;
  if (body.stock !== undefined) patch.stock = Number(body.stock);
  if (body.featured !== undefined) patch.featured = Boolean(body.featured);
  if (body.images !== undefined)
    patch.images = Array.isArray(body.images) ? body.images.filter((u) => typeof u === "string") : [];

  const before = patch.stock !== undefined ? await getProduct(id) : undefined;
  const product = await updateProduct(id, patch);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  await notifyIfRestocked(before, product);

  return NextResponse.json({ product });
});

export const DELETE = withApiErrorHandling(async (
  _request: Request,
  { params }: RouteContext<"/api/admin/products/[id]">
) => {
  const { id } = await params;
  await deleteProduct(id);
  return NextResponse.json({ ok: true });
});
