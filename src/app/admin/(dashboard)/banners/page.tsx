import { getBanners } from "@/lib/db";
import { BannersTable } from "./BannersTable";

// Without this, this list is prerendered once at build time -- banners
// added, edited or reordered afterward wouldn't show up here until the
// next deploy.
export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const banners = await getBanners();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Homepage Banners</h1>
        <p className="mt-1 text-sm text-ink/80">
          These photos slide automatically behind the homepage&apos;s top section. Add, edit,
          reorder or remove them any time -- changes show up immediately on the live site.
        </p>
      </div>
      <BannersTable banners={banners} />
    </div>
  );
}
