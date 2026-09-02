import Link from "next/link";
import { categories } from "@/lib/seed-data";
import { siteConfig } from "@/lib/config";
import { NewsletterSignup } from "@/components/NewsletterSignup";

// lucide-react dropped brand/logo icons a while back, so this is a small
// hand-drawn outline in the same style as the rest of the icon set.
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-cream-dark/60">
      <NewsletterSignup />
      <div className="container-page grid gap-8 py-10 md:grid-cols-3 lg:grid-cols-6">
        <div>
          <p className="font-display text-lg text-maroon">{siteConfig.name}</p>
          <p className="mt-2 text-sm text-ink/80">{siteConfig.tagline}</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink">Shop</p>
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/shop?category=${c.slug}`} className="hover:text-maroon">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink">Help</p>
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            <li>
              <Link href="/about" className="hover:text-maroon">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-maroon">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:text-maroon">
                Track Order
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink">Legal</p>
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            <li>
              <Link href="/terms" className="hover:text-maroon">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-maroon">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink">Get in touch</p>
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            <li>{siteConfig.phone}</li>
            <li>{siteConfig.email}</li>
            <li>{siteConfig.address}</li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink">Follow Us</p>
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            <li>
              <a
                href={siteConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-maroon"
              >
                <InstagramIcon className="h-4 w-4" />
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-sm text-ink/70">
        &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </div>
    </footer>
  );
}
