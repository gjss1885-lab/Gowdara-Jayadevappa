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
          push/clip everything else out of the fixed-height header). The
          scrollbar stays visible (rather than hidden) and a soft fade sits
          over the trailing edge so it's obvious there's more to swipe to,
          and the links get roomier spacing/tap padding for a phone. */}
      <div className="container-page flex h-16 items-center gap-4 sm:h-14">
        <span className="shrink-0 whitespace-nowrap font-display text-lg text-gold-light">
          GJ Admin
        </span>
        <div className="relative min-w-0 flex-1">
          <nav className="flex items-center gap-5 overflow-x-auto py-1 text-[15px]">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "shrink-0 whitespace-nowrap py-1.5 hover:text-gold-light",
                  pathname === link.href ? "text-gold-light" : "text-cream/70"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-ink to-transparent" />
        </div>
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
