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
      {/* Title and "View Store"/"Sign Out" never shrink or wrap; the link
          list in between gets whatever space is left and scrolls
          horizontally there once it runs out -- on a phone or narrow
          tablet that's a swipe instead of the links wrapping onto a
          second line (which used to squash "GJ Admin" onto two lines and
          push/clip everything else out of the fixed-height header). */}
      <div className="container-page flex h-14 items-center gap-4">
        <span className="shrink-0 whitespace-nowrap font-display text-lg text-gold-light">
          GJ Admin
        </span>
        <nav className="flex min-w-0 flex-1 gap-4 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "shrink-0 whitespace-nowrap hover:text-gold-light",
                pathname === link.href ? "text-gold-light" : "text-cream/70"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-4 whitespace-nowrap text-sm">
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
