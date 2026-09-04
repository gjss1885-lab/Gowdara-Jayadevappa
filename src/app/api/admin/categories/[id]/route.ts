import { NextResponse } from "next/server";
import { deleteCategory, updateCategory } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/api-utils";
import type { CategoryPatch } from "@/lib/types";

export const PATCH = withApiErrorHandling(async (
  request: Request,
  { params }: RouteContext<"/api/admin/categories/[id]">
) => {
  const { id } = await params;
  const body = (await request.json()) as Partial<CategoryPatch>;

  const patch: CategoryPatch = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.description !== undefined) patch.description = body.description;
  if (body.image !== undefined) patch.image = body.image;

  const category = await updateCategory(id, patch);
  if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });

  return NextResponse.json({ category });
});

export const DELETE = withApiErrorHandling(async (
  _request: Request,
  { params }: RouteContext<"/api/admin/categories/[id]">
) => {
  const { id } = await params;
  await deleteCategory(id);
  return NextResponse.json({ ok: true });
});
