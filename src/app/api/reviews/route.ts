import { NextResponse } from "next/server";
import { createReview, getProduct, listOrders } from "@/lib/db";
import { hasPurchasedProduct } from "@/lib/order-match";
import { withApiErrorHandling } from "@/lib/api-utils";
import type { ReviewInput } from "@/lib/types";

export const POST = withApiErrorHandling(async (request: Request) => {
  const body = (await request.json()) as Partial<ReviewInput>;

  const productId = body.productId?.trim();
  const authorName = body.authorName?.trim();
  const email = body.email?.trim();
  const reviewBody = body.body?.trim();
  const rating = Number(body.rating);

  if (!productId || !authorName || !email || !reviewBody) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Please choose a rating from 1 to 5." }, { status: 400 });
  }

  // Images are already-uploaded URLs (see api/reviews/upload-image), not
  // raw files -- the review form uploads each photo first and only sends
  // the resulting URLs here. Trust nothing about their shape from the
  // client beyond "array of strings", and cap the count server-side too
  // in case someone bypasses the form's own limit.
  const images = Array.isArray(body.images)
    ? body.images.filter((url): url is string => typeof url === "string").slice(0, 5)
    : [];

  const product = await getProduct(productId);
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const orders = await listOrders();
  const verifiedPurchase = hasPurchasedProduct(orders, email, productId);

  const review = await createReview({
    productId,
    authorName,
    email,
    rating,
    title: body.title?.trim() || undefined,
    body: reviewBody,
    images,
    verifiedPurchase,
  });

  return NextResponse.json({ review });
});
