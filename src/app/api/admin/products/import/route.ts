import Papa from "papaparse";
import { NextResponse } from "next/server";
import { createProduct, getCategories, getProduct, updateProduct } from "@/lib/db";
import { slugify } from "@/lib/format";
import { withApiErrorHandling } from "@/lib/api-utils";

// Bulk product import from a CSV file -- the counterpart to
// api/admin/products/export/route.ts, and matching column layout, so
// "export, edit in a spreadsheet, re-import" is a real workflow (bulk
// price updates, adding a batch of new sarees, etc).
//
// Upserts by slug: a row whose slug matches an existing product updates
// it in place; anything else is created as a new product. Missing/blank
// slug falls back to slugify(name), same as the single-product create API.
// Every row is processed independently and reported on its own -- one bad
// row (unknown category, non-numeric price) doesn't abort the whole file.

const MAX_ROWS = 500;

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return ["true", "1", "yes", "y"].includes(value.trim().toLowerCase());
}

function parseNumber(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export const POST = withApiErrorHandling(async (request: Request) => {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors.length > 0) {
    return NextResponse.json(
      { error: `Couldn't parse the CSV: ${parsed.errors[0].message} (row ${parsed.errors[0].row ?? "?"}).` },
      { status: 400 }
    );
  }

  const rows = parsed.data;
  if (rows.length === 0) {
    return NextResponse.json({ error: "The file has no data rows." }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Please import at most ${MAX_ROWS} products at a time.` }, { status: 400 });
  }

  const categories = await getCategories();
  const knownCategorySlugs = new Set(categories.map((c) => c.slug));

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  // Sequential, not Promise.all -- these are writes (create/update), and
  // running them one at a time keeps error messages attributable to a
  // specific row number without extra bookkeeping.
  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // +1 for 0-index, +1 for the header row
    const row = rows[i];

    const name = row.name?.trim();
    if (!name) {
      errors.push(`Row ${rowNum}: missing "name".`);
      continue;
    }

    const category = row.category?.trim();
    if (!category) {
      errors.push(`Row ${rowNum}: missing "category".`);
      continue;
    }
    if (!knownCategorySlugs.has(category)) {
      errors.push(
        `Row ${rowNum}: unknown category "${category}" (expected one of: ${[...knownCategorySlugs].join(", ")}).`
      );
      continue;
    }

    const price = parseNumber(row.price);
    if (price === null || price <= 0) {
      errors.push(`Row ${rowNum}: "price" must be a positive number.`);
      continue;
    }

    const compareAtPriceRaw = row.compareAtPrice?.trim();
    const compareAtPrice = compareAtPriceRaw ? parseNumber(compareAtPriceRaw) : null;
    if (compareAtPriceRaw && compareAtPrice === null) {
      errors.push(`Row ${rowNum}: "compareAtPrice" must be a number if set.`);
      continue;
    }

    const stockRaw = row.stock?.trim();
    const stock = stockRaw ? parseNumber(stockRaw) : 0;
    if (stockRaw && stock === null) {
      errors.push(`Row ${rowNum}: "stock" must be a number if set.`);
      continue;
    }

    const slug = row.slug?.trim() || slugify(name);
    const images = (row.images ?? "")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);

    const input = {
      slug,
      name,
      category,
      price,
      compareAtPrice,
      description: row.description ?? "",
      fabric: row.fabric ?? "",
      color: row.color ?? "",
      stock: stock ?? 0,
      featured: parseBoolean(row.featured),
      images,
    };

    try {
      const existing = await getProduct(slug);
      if (existing) {
        await updateProduct(existing.id, input);
        updated += 1;
      } else {
        await createProduct(input);
        created += 1;
      }
    } catch (error) {
      errors.push(`Row ${rowNum} (${name}): ${error instanceof Error ? error.message : "failed to save."}`);
    }
  }

  return NextResponse.json({ created, updated, errors });
});
