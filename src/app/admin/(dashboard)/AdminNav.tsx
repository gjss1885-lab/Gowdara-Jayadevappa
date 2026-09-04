"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/newsletter", label: "Newsletter" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="border-b border-line bg-ink text-cream">
      <div className="container-page flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-display text-lg text-gold-light">GJ Admin</span>
          <nav className="flex gap-4 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "hover:text-gold-light",
                  pathname === link.href ? "text-gold-light" : "text-cream/70"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-cream/70 hover:text-gold-light">
            View Store
          </Link>
          <button onClick={handleLogout} className="text-cream/70 hover:text-gold-light">
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
