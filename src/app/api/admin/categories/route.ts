import { NextResponse } from "next/server";
import { createCategory, getCategories } from "@/lib/db";
import { slugify } from "@/lib/format";
import { withApiErrorHandling } from "@/lib/api-utils";
import type { CategoryInput } from "@/lib/types";

export const POST = withApiErrorHandling(async (request: Request) => {
  const body = (await request.json()) as Partial<CategoryInput>;

  if (!body.name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const slug = body.slug?.trim() || slugify(body.name);
  const existing = await getCategories();
  if (existing.some((c) => c.slug === slug)) {
    return NextResponse.json(
      { error: `A category with the URL slug "${slug}" already exists -- choose a different name or slug.` },
      { status: 400 }
    );
  }

  // New categories go to the end of the display order by default -- admin
  // can move them up from /admin/categories afterward if they want them
  // shown earlier.
  const nextSortOrder = existing.reduce((max, c) => Math.max(max, c.sortOrder), 0) + 1;

  const category = await createCategory({
    slug,
    name: body.name,
    description: body.description ?? "",
    image: body.image ?? null,
    sortOrder: nextSortOrder,
  });

  return NextResponse.json({ category });
});
