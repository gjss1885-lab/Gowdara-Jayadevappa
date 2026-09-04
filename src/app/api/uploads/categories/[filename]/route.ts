import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

// Serves category cover photos saved by the local (no-Supabase) upload
// fallback -- see api/admin/categories/upload-image/route.ts and
// api/uploads/products/[filename]/route.ts (same reasoning, mirrored here).
//
// Public (no admin check) because category photos need to be visible to
// shoppers, not just the admin who uploaded them.

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads", "categories");

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(_request: Request, { params }: RouteContext<"/api/uploads/categories/[filename]">) {
  const { filename } = await params;

  if (!/^[a-zA-Z0-9-]+\.[a-zA-Z0-9]+$/.test(filename)) {
    return NextResponse.json({ error: "Invalid filename." }, { status: 400 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }

  try {
    const buffer = await fs.readFile(path.join(UPLOADS_DIR, filename));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
