import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ALO Education — Premium Study Abroad Consultancy & CRM Platform | UK · Canada · Australia · USA · Ireland · NZ · Dubai",
  description:
    "ALO Education is Bangladesh's premium study-abroad consultancy and CRM platform. Expert counseling for UK, Canada, Australia, USA, Ireland, New Zealand & Dubai. Find courses, secure scholarships, ace your English test (IELTS, PTE, TOEFL, Duolingo, OIETC, OET) and get your visa — powered by ALO AI Copilot. 12,500+ students guided, 97% visa success.",
  keywords: [
    "study abroad", "ALO Education", "UK universities", "Canada study permit", "Australia student visa",
    "USA F1 visa", "Ireland study", "New Zealand study", "Dubai universities",
    "IELTS", "PTE", "TOEFL", "Duolingo", "OIETC", "OET", "English test prep",
    "scholarships", "university application", "visa guidance", "Bangladesh education consultancy",
  ],
  authors: [{ name: "ALO Education" }],
  icons: {
    icon: "/images/logo-mark.png",
  },
  openGraph: {
    title: "ALO Education — Premium Study Abroad Consultancy & CRM Platform",
    description:
      "From your ambition to admission, we're with you all the way. Expert counseling, course finder, scholarships, English test prep, visa guidance and AI Copilot across 7 destinations.",
    url: "https://aloeducation.com",
    siteName: "ALO Education",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ALO Education — Study Abroad Consultancy & CRM",
    description: "Premium study-abroad guidance across 7 destinations. 12,500+ students. 97% visa success.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
