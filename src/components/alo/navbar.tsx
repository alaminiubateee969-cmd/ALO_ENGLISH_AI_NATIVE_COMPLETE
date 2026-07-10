"use client";

import { useEffect, useState } from "react";
import { Menu, X, ChevronDown, Phone, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink,
  NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useApp } from "./app-shell";
import { EXAM_MODULES } from "@/lib/exam-catalog";

const NAV_LINKS = [
  { id: "computer-based-exams", label: "Exams" },
  { id: "mock-tests", label: "Mock Tests" },
  { id: "pricing", label: "Pricing" },
  { id: "ambassador", label: "Ambassador" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
];

export function AloNavbar() {
  const { openAuth } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  return (
    <header className={cn("sticky top-0 z-40 w-full transition-all duration-300", scrolled ? "bg-white/90 backdrop-blur-md border-b border-slate-200/80 alo-shadow-sm" : "bg-white/60 backdrop-blur-sm")}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <button onClick={() => scrollTo("top")} className="flex items-center gap-2.5 shrink-0">
            <img src="/images/alo-logo.webp" alt="ALO Education logo" className="h-9 w-9 rounded-lg object-contain" />
            <div className="leading-tight text-left">
              <div className="text-[15px] font-extrabold tracking-tight text-alo-navy">ALO <span className="text-alo-orange">English</span></div>
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-alo-faint">Test Platform</div>
            </div>
          </button>

          <nav className="hidden lg:flex items-center gap-1">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger onClick={() => scrollTo("computer-based-exams")} className="bg-transparent text-sm font-semibold text-alo-navy hover:bg-alo-soft-blue data-[state=open]:bg-alo-soft-blue">Tests</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[600px] p-3">
                      <div className="grid gap-1 md:grid-cols-2">
                        {EXAM_MODULES.filter((e) => e.popular).slice(0, 8).map((exam) => (
                          <button key={exam.id} onClick={() => scrollTo("computer-based-exams")} className="group flex items-center gap-3 rounded-xl p-2.5 hover:bg-alo-soft-blue transition-colors text-left">
                            <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white", exam.accent === "orange" ? "bg-alo-orange" : exam.accent === "royal" ? "bg-alo-royal" : exam.accent === "green" ? "bg-emerald-500" : exam.accent === "purple" ? "bg-purple-500" : "bg-alo-blue")}>
                              <GraduationCap className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-alo-navy group-hover:text-alo-blue">{exam.name}</div>
                              <div className="text-xs text-alo-faint line-clamp-1">{exam.tagline}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                      <button onClick={() => scrollTo("computer-based-exams")} className="mt-2 w-full rounded-lg bg-alo-soft-blue px-3 py-2 text-center text-xs font-bold text-alo-blue hover:bg-alo-blue/10">
                        View all {EXAM_MODULES.length} computer-based exams →
                      </button>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                {NAV_LINKS.slice(1).map((link) => (
                  <NavigationMenuItem key={link.id}>
                    <NavigationMenuLink onClick={() => scrollTo(link.id)} className={navigationMenuTriggerStyle({ className: "bg-transparent text-sm font-semibold text-alo-navy hover:bg-alo-soft-blue hover:text-alo-blue cursor-pointer" })}>
                      {link.label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <button onClick={() => openAuth("login")} className="h-11 rounded-xl px-4 text-sm font-semibold text-alo-blue hover:bg-alo-soft-blue">Login</button>
            <Button onClick={() => openAuth("register")} className="h-12 rounded-xl bg-alo-orange px-5 text-sm font-semibold text-white alo-shadow-orange hover:bg-[#cc3f10]">
              <Phone className="mr-1.5 h-4 w-4" />Start Free Practice
            </Button>
          </div>

          <button onClick={() => setMobileOpen((v) => !v)} className="lg:hidden grid h-10 w-10 place-items-center rounded-lg text-alo-navy hover:bg-alo-soft-blue" aria-label="Toggle menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white max-h-[80vh] overflow-y-auto alo-scroll">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <button key={link.id} onClick={() => scrollTo(link.id)} className="block w-full text-left rounded-lg px-3 py-2.5 text-sm font-semibold text-alo-navy hover:bg-alo-soft-blue">{link.label}</button>
            ))}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => { setMobileOpen(false); openAuth("login"); }} className="h-11 rounded-xl border-alo-blue/30 text-alo-blue">Login</Button>
              <Button onClick={() => { setMobileOpen(false); openAuth("register"); }} className="h-11 rounded-xl bg-alo-orange text-white hover:bg-[#cc3f10]">Start Free</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
