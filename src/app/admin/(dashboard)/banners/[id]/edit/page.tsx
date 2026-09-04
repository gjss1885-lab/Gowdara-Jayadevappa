import { notFound } from "next/navigation";
import { getBanners } from "@/lib/db";
import { BannerForm } from "../../BannerForm";

export const dynamic = "force-dynamic";

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const banners = await getBanners();
  const banner = banners.find((b) => b.id === id);
  if (!banner) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">Edit Banner</h1>
      <BannerForm initial={banner} />
    </div>
  );
}
