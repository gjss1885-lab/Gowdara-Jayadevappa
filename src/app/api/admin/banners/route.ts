import { NextResponse } from "next/server";
import { createBanner, getBanners } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/api-utils";
import type { BannerInput } from "@/lib/types";

export const POST = withApiErrorHandling(async (request: Request) => {
  const body = (await request.json()) as Partial<BannerInput>;

  if (!body.image) {
    return NextResponse.json({ error: "An image is required." }, { status: 400 });
  }

  // New banners go to the end of the slide order by default -- Om can
  // reorder from /admin/banners afterward.
  const existing = await getBanners();
  const nextSortOrder = existing.length
    ? Math.max(...existing.map((b) => b.sortOrder)) + 1
    : 1;

  const banner = await createBanner({
    image: body.image,
    alt: body.alt?.trim() ?? "",
    sortOrder: nextSortOrder,
  });

  return NextResponse.json({ banner });
});
