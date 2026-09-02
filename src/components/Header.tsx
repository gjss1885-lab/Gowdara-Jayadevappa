"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { User } from "lucide-react";
import { CartButton } from "@/components/CartButton";
import { FavoritesButton } from "@/components/FavoritesButton";
import { HeaderSearch } from "@/components/HeaderSearch";
import { MoreMenu } from "@/components/MoreMenu";
import { siteConfig } from "@/lib/config";

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur">
      <div className="temple-border" />
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className={clsx(
            "min-w-0 truncate font-display text-base font-semibold tracking-wide text-maroon-dark sm:text-xl md:text-2xl",
            searchOpen && "hidden sm:block"
          )}
        >
          {siteConfig.name}
        </Link>

        <div className="flex flex-1 shrink-0 items-center justify-end gap-1">
          <HeaderSearch
            open={searchOpen}
            onOpen={() => setSearchOpen(true)}
            onClose={() => setSearchOpen(false)}
          />
          <div className={clsx("flex shrink-0 items-center gap-1", searchOpen && "hidden sm:flex")}>
            {/* Phones: Account + Favorites fold into one menu to save width.
                Tablet/laptop and up: same individual icons as before. */}
            <div className="sm:hidden">
              <MoreMenu />
            </div>
            <div className="hidden items-center gap-1 sm:flex">
              <Link
                href="/account"
                className="rounded-md p-1.5 text-ink hover:text-maroon"
                aria-label="Account"
              >
                <User className="h-5 w-5" strokeWidth={1.75} />
              </Link>
              <FavoritesButton />
            </div>
            <CartButton />
          </div>
        </div>
      </div>
    </header>
  );
}
