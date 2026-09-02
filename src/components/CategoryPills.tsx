import Link from "next/link";
import clsx from "clsx";
import type { Category } from "@/lib/types";

export function CategoryPills({
  categories,
  active,
}: {
  categories: Category[];
  active?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/shop"
        className={clsx(
          "rounded-full border px-4 py-1.5 text-sm transition",
          !active
            ? "border-maroon bg-maroon text-white"
            : "border-line text-ink/80 hover:border-maroon hover:text-maroon"
        )}
      >
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/shop?category=${c.slug}`}
          className={clsx(
            "rounded-full border px-4 py-1.5 text-sm transition",
            active === c.slug
              ? "border-maroon bg-maroon text-white"
              : "border-line text-ink/80 hover:border-maroon hover:text-maroon"
          )}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
