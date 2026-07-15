import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ALO English Education — English Learning, Exams & CRM",
    template: "%s · ALO English Education",
  },
  description:
    "ALO English Education delivers IELTS, PTE, TOEFL, Duolingo, OIETC and Oxford ELLT preparation with AI tutors, mock tests, and verified certificates — backed by a full CRM.",
  keywords: [
    "IELTS preparation",
    "PTE Academic",
    "TOEFL",
    "Duolingo English Test",
    "OIETC",
    "Oxford ELLT",
    "Spoken English",
    "English courses Bangladesh",
    "ALO Education",
  ],
  authors: [{ name: "ALO Education" }],
  openGraph: {
    title: "ALO English Education — English Learning, Exams & CRM",
    description:
      "Learn English. Ace your exam. Achieve your dream. AI-powered IELTS, PTE & TOEFL preparation with verified certificates.",
    type: "website",
    url: "https://english.aloeducation.com",
    siteName: "ALO English Education",
  },
  twitter: {
    card: "summary_large_image",
    title: "ALO English Education",
    description:
      "Learn English. Ace your exam. Achieve your dream.",
  },
  metadataBase: new URL("https://english.aloeducation.com"),
};

export const viewport = {
  themeColor: "#0B1F3A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white font-sans text-alo-ink antialiased">
        {children}
      </body>
    </html>
  );
}
