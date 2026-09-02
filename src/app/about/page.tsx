import { siteConfig } from "@/lib/config";

export const metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <div className="container-page max-w-2xl py-16">
      <h1 className="mb-6 font-display text-3xl text-ink">About {siteConfig.name}</h1>
      <div className="space-y-4 leading-relaxed text-ink/90">
        <p>
          {siteConfig.name} brings handpicked sarees — Kanjivaram, Banarasi, Mysore silk, cotton and
          more — to homes across India. Every saree is chosen for its weave, finish, and value,
          working directly with weavers to keep quality high and prices fair.
        </p>
        <p>
          Based in {siteConfig.address}, we pack and ship every order carefully, and stand behind
          what we sell. If anything about your order isn’t right, reach out and we’ll make it
          right.
        </p>
      </div>
    </div>
  );
}
