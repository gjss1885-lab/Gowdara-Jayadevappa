import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isSupabaseAdminConfigured } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { withApiErrorHandling } from "@/lib/api-utils";

// Handles a category cover-photo upload from the admin panel (see
// CategoryForm.tsx). Mirrors api/admin/products/upload-image/route.ts --
// see that file for the reasoning on the two storage modes below.

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
      .from("category-images")
      .upload(filename, buffer, { contentType: file.type, upsert: false });

    if (error) {
      return NextResponse.json(
        {
          error: `Upload failed: ${error.message}. Make sure you've run the latest supabase/schema.sql, which creates the "category-images" storage bucket.`,
        },
        { status: 500 }
      );
    }

    const { data } = supabase.storage.from("category-images").getPublicUrl(filename);
    return NextResponse.json({ url: data.publicUrl });
  }

  const uploadsDir = path.join(process.cwd(), "data", "uploads", "categories");
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, filename), buffer);

  return NextResponse.json({ url: `/api/uploads/categories/${filename}` });
});
