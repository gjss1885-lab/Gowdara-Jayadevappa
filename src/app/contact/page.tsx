import { Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/lib/config";

export const metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <div className="container-page max-w-2xl py-16">
      <h1 className="mb-6 font-display text-3xl text-ink">Get in Touch</h1>
      <div className="space-y-4">
        <ContactRow icon={Phone} label={siteConfig.phone} />
        <ContactRow icon={Mail} label={siteConfig.email} />
        <ContactRow icon={MapPin} label={siteConfig.address} />
      </div>
      <p className="mt-8 text-sm text-ink/80">
        For order queries, please have your order number ready — you’ll find it on your
        confirmation page or in your account order history.
      </p>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 text-ink/90">
      <Icon className="h-5 w-5 text-maroon" strokeWidth={1.5} />
      <span>{label}</span>
    </div>
  );
}
