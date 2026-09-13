import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isSupabaseAdminConfigured } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { withApiErrorHandling } from "@/lib/api-utils";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// Handles a single review photo upload from the review form (see
// ReviewForm.tsx). Called once per selected file, returns the URL to
// attach to the review once it's submitted. Mirrors
// api/admin/products/upload-image/route.ts exactly, just with its own
// bucket/folder so customer-submitted photos don't mix with admin product
// photos.
//
// - With Supabase connected: stored in the "review-images" Storage bucket
//   (created by supabase/schema.sql) and served from Supabase's public URL.
// - Without Supabase: saved to disk and served back by
//   api/uploads/reviews/[filename]/route.ts.
//
// This is public (any shopper can call it, not just logged-in admins) --
// same trust level as the review form itself, which anyone can submit.

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

export const POST = withApiErrorHandling(async (request: Request) => {
  // Public + accepts up to 5MB per call, so without a cap this is a way to
  // run up Supabase Storage usage (or fill disk, in local-file mode) for
  // free. 20 uploads/hour per IP comfortably covers someone attaching
  // photos to a couple of real reviews.
  const ip = getClientIp(request);
  if (!rateLimit(`review-upload:${ip}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Please try again later." }, { status: 429 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Images must be 5MB or smaller." }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const filename = `${randomUUID()}.${ext || "jpg"}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (isSupabaseAdminConfigured) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage
      .from("review-images")
      .upload(filename, buffer, { contentType: file.type, upsert: false });

    if (error) {
      return NextResponse.json(
        {
          error: `Upload failed: ${error.message}. Make sure you've run the latest supabase/schema.sql, which creates the "review-images" storage bucket.`,
        },
        { status: 500 }
      );
    }

    const { data } = supabase.storage.from("review-images").getPublicUrl(filename);
    return NextResponse.json({ url: data.publicUrl });
  }

  const uploadsDir = path.join(process.cwd(), "data", "uploads", "reviews");
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, filename), buffer);

  return NextResponse.json({ url: `/api/uploads/reviews/${filename}` });
}, { public: true });
