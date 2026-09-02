import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

// Serves product photos saved by the local (no-Supabase) upload fallback --
// see api/admin/products/upload-image/route.ts. These are deliberately NOT
// stored under /public: Next.js's production server only serves files that
// existed in /public at build time, so a photo uploaded after the app was
// built or deployed would 404 there even on the same machine. Reading the
// file here on every request, from a plain writable folder, avoids that.
//
// This route is public (no admin check) because product photos need to be
// visible to shoppers, not just the admin who uploaded them.

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads", "products");

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(_request: Request, { params }: RouteContext<"/api/uploads/products/[filename]">) {
  const { filename } = await params;

  // Guard against path traversal -- only allow the exact filenames this
  // route itself generates (uuid.ext), nothing with a slash or "..".
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
