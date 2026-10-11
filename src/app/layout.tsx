import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ALO Education — Study Abroad Consultancy",
    template: "%s — ALO Education",
  },
  description:
    "ALO Education helps students study in the UK, Canada, Australia, USA, Ireland, New Zealand and Dubai. University applications, scholarships, visas, English test prep and CRM.",
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
