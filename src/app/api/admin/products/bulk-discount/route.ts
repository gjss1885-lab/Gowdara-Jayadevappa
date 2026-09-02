import { NextResponse } from "next/server";
import { getProduct, updateProduct } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/api-utils";

// Applies (or removes) a discount across a whole set of products at once --
// used by the "Bulk discount" bar on /admin/products, e.g. "10% off every
// Kanjivaram silk" or a hand-picked selection of sarees.
//
// The product's `compareAtPrice` is always treated as the true original
// price once a discount is active, so re-applying a different percentage
// later recalculates from that original rather than discounting an
// already-discounted price. `price` is the number to charge right now.

type BulkDiscountBody = {
  productIds: string[];
  mode: "percent" | "flat" | "clear";
  value?: number;
};

export const POST = withApiErrorHandling(async (request: Request) => {
  const body = (await request.json()) as Partial<BulkDiscountBody>;

  const productIds = Array.isArray(body.productIds)
    ? body.productIds.filter((id) => typeof id === "string")
    : [];
  if (productIds.length === 0) {
    return NextResponse.json({ error: "No products selected." }, { status: 400 });
  }

  if (body.mode !== "percent" && body.mode !== "flat" && body.mode !== "clear") {
    return NextResponse.json({ error: "Invalid discount mode." }, { status: 400 });
  }

  if (body.mode !== "clear") {
    if (typeof body.value !== "number" || !Number.isFinite(body.value) || body.value <= 0) {
      return NextResponse.json({ error: "Enter a discount amount greater than 0." }, { status: 400 });
    }
    if (body.mode === "percent" && body.value >= 100) {
      return NextResponse.json({ error: "Percentage discount must be less than 100." }, { status: 400 });
    }
  }

  let updated = 0;
  const errors: string[] = [];

  for (const id of productIds) {
    const product = await getProduct(id);
    if (!product) {
      errors.push(`Product ${id} not found.`);
      continue;
    }

    if (body.mode === "clear") {
      // Nothing to clear -- leave products with no discount untouched.
      if (product.compareAtPrice == null) continue;
      await updateProduct(id, { price: product.compareAtPrice, compareAtPrice: null });
      updated += 1;
      continue;
    }

    const original = product.compareAtPrice ?? product.price;
    const discounted =
      body.mode === "percent"
        ? Math.round(original * (1 - body.value! / 100))
        : Math.round(original - body.value!);

    if (discounted < 1) {
      errors.push(`${product.name}: discount is too large (price would drop below ₹1).`);
      continue;
    }

    await updateProduct(id, { price: discounted, compareAtPrice: original });
    updated += 1;
  }

  return NextResponse.json({ updated, errors });
});
