import { NextResponse } from "next/server";
import { createProduct } from "@/lib/db";
import { slugify } from "@/lib/format";
import { withApiErrorHandling } from "@/lib/api-utils";
import type { ProductInput } from "@/lib/types";

export const POST = withApiErrorHandling(async (request: Request) => {
  const body = (await request.json()) as Partial<ProductInput>;

  if (!body.name || !body.category || !body.price) {
    return NextResponse.json({ error: "Name, category and price are required." }, { status: 400 });
  }

  const product = await createProduct({
    slug: body.slug?.trim() || slugify(body.name),
    name: body.name,
    category: body.category,
    price: Number(body.price),
    compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : null,
    description: body.description ?? "",
    fabric: body.fabric ?? "",
    color: body.color ?? "",
    stock: body.stock !== undefined ? Number(body.stock) : 0,
    featured: Boolean(body.featured),
    images: Array.isArray(body.images) ? body.images.filter((u) => typeof u === "string") : [],
  });

  return NextResponse.json({ product });
});
