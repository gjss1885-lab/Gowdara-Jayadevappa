import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/lib/cart-context";
import { FavoritesProvider } from "@/lib/favorites-context";
import { siteConfig, siteUrl, gaMeasurementId } from "@/lib/config";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

// metadataBase lets every page below set OG/Twitter images and canonical
// links as relative paths instead of having to build an absolute URL by
// hand everywhere -- Next resolves them against this. siteUrl already
// falls back sensibly (explicit env var -> Vercel's own deploy URL ->
// localhost), same helper the invoice/email links already use.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: `%s | ${siteConfig.name}`,
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary",
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col font-sans antialiased">
        <GoogleAnalytics measurementId={gaMeasurementId} />
        {/* Visually hidden until focused -- lets keyboard users jump past
            the header/nav straight to the page content instead of tabbing
            through every header link on every single page. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-maroon focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        <FavoritesProvider>
          <CartProvider>
            <Header />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
          </CartProvider>
        </FavoritesProvider>
      </body>
    </html>
  );
}
