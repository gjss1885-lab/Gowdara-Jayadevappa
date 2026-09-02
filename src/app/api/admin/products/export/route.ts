import { listProducts } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/api-utils";

// Escapes a single CSV field: wraps in quotes (doubling any quotes inside)
// whenever the value contains a comma, quote, or newline that would
// otherwise break the format. Mirrors api/admin/orders/export/route.ts.
function csvField(value: string | number | boolean): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Column order doubles as the expected import format -- see
// api/admin/products/import/route.ts, which reads these same header names
// back (case-insensitively) rather than relying on column position, so a
// spreadsheet edited and re-saved with reordered columns still imports.
const HEADERS = [
  "slug",
  "name",
  "category",
  "price",
  "compareAtPrice",
  "description",
  "fabric",
  "color",
  "stock",
  "featured",
  "images",
];

export const GET = withApiErrorHandling(async () => {
  const products = await listProducts();

  const rows = products.map((p) =>
    [
      p.slug,
      p.name,
      p.category,
      p.price,
      p.compareAtPrice ?? "",
      p.description,
      p.fabric,
      p.color,
      p.stock,
      p.featured ? "true" : "false",
      (p.images ?? []).join("|"),
    ]
      .map(csvField)
      .join(",")
  );

  const csv = [HEADERS.join(","), ...rows].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-${date}.csv"`,
    },
  });
});
