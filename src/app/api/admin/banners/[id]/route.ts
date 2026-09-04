import { NextResponse } from "next/server";
import { deleteBanner, updateBanner } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/api-utils";
import type { BannerPatch } from "@/lib/types";

export const PATCH = withApiErrorHandling(async (
  request: Request,
  { params }: RouteContext<"/api/admin/banners/[id]">
) => {
  const { id } = await params;
  const body = (await request.json()) as Partial<BannerPatch>;

  const patch: BannerPatch = {};
  if (body.image !== undefined) patch.image = body.image;
  if (body.alt !== undefined) patch.alt = body.alt;
  if (body.sortOrder !== undefined) patch.sortOrder = body.sortOrder;

  const banner = await updateBanner(id, patch);
  if (!banner) return NextResponse.json({ error: "Banner not found." }, { status: 404 });

  return NextResponse.json({ banner });
});

export const DELETE = withApiErrorHandling(async (
  _request: Request,
  { params }: RouteContext<"/api/admin/banners/[id]">
) => {
  const { id } = await params;
  await deleteBanner(id);
  return NextResponse.json({ ok: true });
});
