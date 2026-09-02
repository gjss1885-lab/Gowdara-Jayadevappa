import { listAllAddresses, listAllReviews, listAllStockNotifications, listOrders, listProducts } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/api-utils";

// On-demand full data export for the admin panel -- a manual safety net,
// downloadable any time as a single JSON file. This is NOT a substitute
// for Supabase's own automatic/point-in-time backups (which Om should
// still enable in the Supabase project settings once on a plan that
// offers them) -- this app has no direct access to Om's live database to
// schedule anything there itself (standing rule for this project). What
// this route CAN do is use the same app code that's already trusted to
// read the data (the same functions every page uses) and hand back a
// complete snapshot, from wherever Om is running it, using his own
// credentials.
export const GET = withApiErrorHandling(async () => {
  const [products, orders, reviews, stockNotifications, addresses] = await Promise.all([
    listProducts(),
    listOrders(),
    listAllReviews(),
    listAllStockNotifications(),
    listAllAddresses(),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    products,
    orders,
    reviews,
    stockNotifications,
    addresses,
  };

  const date = new Date().toISOString().slice(0, 10);

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="gowdara-jayadevappa-backup-${date}.json"`,
    },
  });
});
