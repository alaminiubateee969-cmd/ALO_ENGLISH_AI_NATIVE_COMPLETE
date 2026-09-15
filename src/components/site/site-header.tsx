"use client";

import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="rounded bg-blue-600 px-2 py-1 text-white text-sm">ALO</span>
          <span className="hidden sm:inline">Education</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-1">
          {[
            { label: "Destinations", href: "/destinations" },
            { label: "Course Finder", href: "/course-finder" },
            { label: "Universities", href: "/universities" },
            { label: "Scholarships", href: "/scholarships" },
            { label: "Exam Prep", href: "/exam-prep" },
            { label: "Language Prep", href: "/language-prep" },
            { label: "AI Handbook", href: "/ask-handbook" },
            { label: "Resources", href: "/resources" },
            { label: "Contact", href: "/contact" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-2">
          <Link href="/portals" className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Portals</Link>
          <Link href="/login" className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Login</Link>
          <Link href="/book-consultation" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Free Consultation</Link>
        </div>
      </div>
    </header>
  );
}
