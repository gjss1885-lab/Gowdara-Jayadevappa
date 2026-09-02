import { listNewsletterSubscribers } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/api-utils";

// Escapes a single CSV field -- same helper as the orders/products export
// routes (kept local to each route rather than shared, since it's three
// lines and not worth a shared module for).
function csvField(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const HEADERS = ["Email", "Subscribed"];

export const GET = withApiErrorHandling(async () => {
  const subscribers = await listNewsletterSubscribers();

  const rows = subscribers.map((s) =>
    [s.email, new Date(s.createdAt).toISOString()].map(csvField).join(",")
  );

  const csv = [HEADERS.join(","), ...rows].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-subscribers-${date}.csv"`,
    },
  });
});
