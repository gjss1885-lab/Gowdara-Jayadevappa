import Link from "next/link";
import { listOrders, listProducts, dataBackend } from "@/lib/db";
import { isRazorpayConfigured, isSupabaseConfigured } from "@/lib/config";
import { formatINR } from "@/lib/format";

// Always show live counts -- without this the dashboard would be frozen at
// whatever the numbers were during the last deploy's build.
export const dynamic = "force-dynamic";

// Counted as "real" sales for revenue/chart/top-products purposes -- a
// pending-payment order hasn't actually paid yet, and a cancelled one
// isn't revenue either way.
function isCountedOrder(status: string) {
  return status !== "cancelled" && status !== "pending_payment";
}

export default async function AdminDashboardPage() {
  const [products, orders] = await Promise.all([listProducts(), listOrders()]);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStock = products.filter((p) => p.stock <= 0).length;
  const pendingOrders = orders.filter((o) => o.status === "pending_payment").length;
  const countedOrders = orders.filter((o) => isCountedOrder(o.status));
  const revenue = countedOrders.reduce((sum, o) => sum + o.total, 0);

  // Revenue for each of the last 14 days, oldest first, so a shop owner
  // can see the trend at a glance.
  const DAYS = 14;
  const dailyRevenue: { date: string; total: number }[] = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (DAYS - 1 - i));
    return { date: d.toISOString().slice(0, 10), total: 0 };
  });
  const dayIndex = new Map(dailyRevenue.map((d, i) => [d.date, i]));
  for (const order of countedOrders) {
    const day = order.createdAt.slice(0, 10);
    const idx = dayIndex.get(day);
    if (idx !== undefined) dailyRevenue[idx].total += order.total;
  }
  const maxDaily = Math.max(1, ...dailyRevenue.map((d) => d.total));

  // Best-selling products by quantity across every counted order.
  const quantityByProduct = new Map<string, number>();
  for (const order of countedOrders) {
    for (const item of order.items) {
      quantityByProduct.set(item.name, (quantityByProduct.get(item.name) ?? 0) + item.quantity);
    }
  }
  const topProducts = [...quantityByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl text-ink">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Products" value={String(products.length)} />
        <Stat label="Orders" value={String(orders.length)} />
        <Stat label="Pending Payment" value={String(pendingOrders)} />
        <Stat label="Revenue" value={formatINR(revenue)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-line bg-white/60 p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg text-ink">Revenue — last 14 days</h2>
          <div className="flex h-32 items-end gap-1.5">
            {dailyRevenue.map((d) => (
              <div
                key={d.date}
                className="group relative flex-1"
                title={`${new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: ${formatINR(d.total)}`}
              >
                <div
                  className="w-full rounded-t bg-maroon/80 transition group-hover:bg-maroon"
                  style={{ height: `${Math.max(3, (d.total / maxDaily) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-ink/70">
            <span>{new Date(dailyRevenue[0].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            <span>Today</span>
          </div>
        </div>

        <div className="rounded-md border border-line bg-white/60 p-5">
          <h2 className="mb-4 font-display text-lg text-ink">Top Sellers</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-ink/70">No sales yet.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {topProducts.map(([name, qty], i) => (
                <li key={name} className="flex items-center justify-between gap-2">
                  <span className="truncate text-ink/90">
                    {i + 1}. {name}
                  </span>
                  <span className="shrink-0 font-medium text-maroon">{qty} sold</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {(lowStock > 0 || outOfStock > 0) && (
        <div className="rounded-md border border-gold bg-gold-light/20 p-4 text-sm text-ink/90">
          {lowStock > 0 && <p>{lowStock} product(s) are low on stock (5 or fewer).</p>}
          {outOfStock > 0 && <p>{outOfStock} product(s) are out of stock.</p>}
        </div>
      )}

      <div className="rounded-md border border-line bg-white/60 p-5">
        <h2 className="mb-3 font-display text-lg text-ink">Setup Status</h2>
        <ul className="space-y-2 text-sm text-ink/90">
          <StatusRow ok={dataBackend === "supabase"} label={`Database: ${dataBackend === "supabase" ? "Supabase (live)" : "Local file (demo data)"}`} />
          <StatusRow ok={isSupabaseConfigured} label={`Customer login (OTP): ${isSupabaseConfigured ? "Connected" : "Not connected yet"}`} />
          <StatusRow ok={isRazorpayConfigured} label={`Online payments (Razorpay): ${isRazorpayConfigured ? "Connected" : "Not connected — orders use Cash on Delivery"}`} />
        </ul>
        <p className="mt-4 text-sm text-ink/70">
          See <code>SETUP.md</code> in the project for step-by-step instructions to connect each of
          these.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/products" className="rounded-md bg-maroon px-4 py-2 text-sm font-semibold text-white hover:bg-maroon-dark">
          Manage Products
        </Link>
        <Link href="/admin/orders" className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-maroon">
          View Orders
        </Link>
        <Link
          href="/api/admin/backup"
          className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-maroon"
        >
          Download Full Backup
        </Link>
      </div>
      <p className="text-sm text-ink/70">
        This downloads a snapshot of everything (products, orders, reviews, addresses) as a JSON
        file, any time. For real production safety once this store is live, also turn on
        Supabase&rsquo;s own automatic backups in your project settings — this button is a handy
        extra, not a replacement for that.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-white/60 p-4">
      <p className="text-sm uppercase tracking-wide text-ink/70">{label}</p>
      <p className="mt-1 font-display text-2xl text-ink">{value}</p>
    </div>
  );
}

function StatusRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${ok ? "bg-green-600" : "bg-gold"}`} />
      {label}
    </li>
  );
}
