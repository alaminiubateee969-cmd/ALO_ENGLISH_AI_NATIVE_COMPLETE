import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ALO English — Premium English Exam Practice",
    template: "%s — ALO English",
  },
  description:
    "Real exam-aligned practice for IELTS, PTE, TOEFL, Duolingo, OIETC, OET & more. Timed mock tests, AI speaking evaluator, writing feedback and Smart Score reports.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
