import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";

// Served at /robots.txt automatically. Keeps crawlers out of admin,
// account, and API routes -- none of that is content anyone should be
// indexing, and account/order pages could otherwise leak into search
// results for URLs that happen to be guessable.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/account", "/api/", "/cart", "/checkout"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
