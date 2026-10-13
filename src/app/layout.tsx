import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import type { Metadata } from "next";
import { resolveSiteUrl } from "@/lib/public-routes";
import "./globals.css";

const SITE_URL = resolveSiteUrl();
const SITE_DESCRIPTION =
  "ALO Education helps students study in the UK, Canada, Australia, USA, Ireland, New Zealand and Dubai. University applications, scholarships, visas, English test prep and CRM.";

export const metadata: Metadata = {
  // metadataBase makes every relative canonical/OpenGraph URL absolute. Without
  // it Next.js warns at build time and social crawlers resolve against the
  // wrong host.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ALO Education — Study Abroad Consultancy",
    template: "%s — ALO Education",
  },
  description: SITE_DESCRIPTION,
  applicationName: "ALO English",
  // Authenticated and machine surfaces declare noindex at the page level too;
  // this is the site-wide default for the public content pages.
  robots: {
    index: true,
    follow: true,
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "ALO Education",
    url: SITE_URL,
    title: "ALO Education — Study Abroad Consultancy",
    description: SITE_DESCRIPTION,
    locale: "en_GB",
    images: [{ url: "/images/alo-logo.webp", alt: "ALO Education" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ALO Education — Study Abroad Consultancy",
    description: SITE_DESCRIPTION,
    images: ["/images/alo-logo.webp"],
  },
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white text-slate-900 antialiased">
        <a
          href="#main-content"
          className="sr-only z-[100] rounded-md bg-white px-4 py-3 font-semibold text-[#0B1F3A] shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:ring-2 focus:ring-[#0057B8]"
        >
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main-content" className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
