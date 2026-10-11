"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { label: "Practice tests", href: "/practice-test" },
  { label: "Exam catalog", href: "/exam-prep" },
  { label: "Study abroad", href: "/destinations" },
  { label: "Course finder", href: "/course-finder" },
  { label: "Handbook", href: "/ask-handbook" },
  { label: "Contact", href: "/contact" },
] as const;

function isCurrentPath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = (mobile = false) => NAV_ITEMS.map((item) => {
    const active = isCurrentPath(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        onClick={() => setMenuOpen(false)}
        className={mobile
          ? `flex min-h-11 items-center justify-between rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] ${active ? "bg-blue-50 text-[#0057B8]" : "text-slate-700 hover:bg-slate-50"}`
          : `rounded-lg px-2.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2 ${active ? "bg-blue-50 text-[#0057B8]" : "text-slate-700 hover:bg-slate-100 hover:text-[#0057B8]"}`}
      >
        <span>{item.label}</span>
        {mobile && active ? <span className="size-1.5 rounded-full bg-[#0057B8]" aria-hidden="true" /> : null}
      </Link>
    );
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="ALO English by ALO Education home"
          onClick={() => setMenuOpen(false)}
          className="group flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-[#0B1F3A] text-xs font-extrabold tracking-wide text-white transition-colors group-hover:bg-[#0057B8]">ALO</span>
          <span className="leading-tight">
            <span className="block text-sm font-extrabold tracking-tight text-[#0B1F3A]">ALO English</span>
            <span className="hidden text-[10px] font-medium text-slate-500 sm:block">by ALO Education</span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-0.5 lg:flex">
          {navLinks()}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <Link
            href="/login"
            className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#0B1F3A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2"
          >
            Log in
          </Link>
          <Link
            href="/exam-prep"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#CC3F10] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#A8320D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8501A] focus-visible:ring-offset-2"
          >
            Explore practice <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <Link
            href="/exam-prep"
            onClick={() => setMenuOpen(false)}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#CC3F10] px-3 text-xs font-bold text-white transition-colors hover:bg-[#A8320D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8501A] focus-visible:ring-offset-2"
          >
            Practice
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid size-10 place-items-center rounded-lg border border-slate-200 text-[#0B1F3A] transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2"
          >
            {menuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <nav
        id="mobile-primary-navigation"
        aria-label="Mobile primary navigation"
        className={`${menuOpen ? "block" : "hidden"} border-t border-slate-200 bg-white px-4 pb-4 pt-3 shadow-lg lg:hidden sm:px-6`}
      >
        <div className="mx-auto grid max-w-7xl gap-1 sm:grid-cols-2">
          {navLinks(true)}
        </div>
        <div className="mx-auto mt-3 flex max-w-7xl gap-2 border-t border-slate-100 pt-3">
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8]"
          >
            Log in
          </Link>
          <Link
            href="/register"
            onClick={() => setMenuOpen(false)}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0B1F3A] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0057B8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2"
          >
            Create account <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
