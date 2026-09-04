import { BannerForm } from "../BannerForm";

export default function NewBannerPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">Add Banner</h1>
      <BannerForm />
    </div>
  );
}
