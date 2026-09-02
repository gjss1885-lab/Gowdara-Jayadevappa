import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isSupabaseAdminConfigured } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { withApiErrorHandling } from "@/lib/api-utils";

// Handles a single product photo upload from the admin panel (see
// ProductForm.tsx). Called once per selected file, returns the URL to save
// on the product once the form is submitted.
//
// - With Supabase connected: stored in the "product-images" Storage bucket
//   (created by supabase/schema.sql) and served from Supabase's public URL.
// - Without Supabase: saved to disk and served back by
//   api/uploads/products/[filename]/route.ts, so the demo store still works
//   with zero accounts. Like local-db.ts, this is a dev convenience only --
//   most hosts (including Vercel) don't persist filesystem writes across
//   deploys/instances, so connect Supabase before real photos matter.

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

export const POST = withApiErrorHandling(async (request: Request) => {
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
      .from("product-images")
      .upload(filename, buffer, { contentType: file.type, upsert: false });

    if (error) {
      return NextResponse.json(
        {
          error: `Upload failed: ${error.message}. Make sure you've run the latest supabase/schema.sql, which creates the "product-images" storage bucket.`,
        },
        { status: 500 }
      );
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(filename);
    return NextResponse.json({ url: data.publicUrl });
  }

  const uploadsDir = path.join(process.cwd(), "data", "uploads", "products");
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, filename), buffer);

  return NextResponse.json({ url: `/api/uploads/products/${filename}` });
});
