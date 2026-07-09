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
  title: "ALO English Test Platform — Premium English Exam Practice | IELTS · PTE · TOEFL · Duolingo · OIETC · OET",
  description:
    "Premium English language testing and preparation platform by ALO Education. Take free mock tests, practice speaking interviews, get writing evaluation, and smart score feedback for IELTS, PTE, TOEFL, Duolingo, OIETC and OET. ALO Education registered students receive 3 free mock tests.",
  keywords: [
    "IELTS practice", "PTE practice", "TOEFL practice", "Duolingo English Test",
    "OIETC", "OET", "English mock test", "speaking practice", "writing evaluation",
    "ALO Education", "English exam preparation", "Bangladesh study abroad",
  ],
  authors: [{ name: "ALO Education" }],
  icons: {
    icon: "/images/logo-mark.png",
  },
  openGraph: {
    title: "ALO English Test Platform — Premium English Exam Practice",
    description:
      "Free mock tests, speaking practice, writing evaluation and smart score feedback. ALO Education students get 3 free mock tests.",
    url: "https://english.aloeducation.com",
    siteName: "ALO English Test Platform",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ALO English Test Platform",
    description: "Premium English exam practice — IELTS, PTE, TOEFL, Duolingo, OIETC, OET.",
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
