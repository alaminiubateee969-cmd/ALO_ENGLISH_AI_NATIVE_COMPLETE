"use client";

import { useEffect, useState } from "react";
import {
  Menu,
  X,
  ChevronDown,
  GraduationCap,
  LogIn,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { EXAM_TYPES } from "@/lib/alo-data";

const NAV_LINKS = [
  { href: "#exams", label: "Exams" },
  { href: "#mock-tests", label: "Mock Tests" },
  { href: "#speaking", label: "Speaking" },
  { href: "#writing", label: "Writing" },
  { href: "#pricing", label: "Pricing" },
  { href: "#ambassador", label: "Ambassador" },
  { href: "#contact", label: "Contact" },
];

export function AloNavbar({ onOpenAuth }: { onOpenAuth: (mode: "login" | "register") => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-sm"
          : "bg-white/0"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <a href="#top" className="flex items-center gap-2.5 shrink-0">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-alo-blue text-white shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-extrabold tracking-tight text-alo-navy">
                ALO <span className="text-alo-orange">English</span>
              </div>
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                Test Platform
              </div>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-sm font-semibold text-alo-navy hover:bg-alo-soft-blue data-[state=open]:bg-alo-soft-blue">
                    Tests
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[640px] gap-1 p-3 md:grid-cols-2">
                      {EXAM_TYPES.map((exam) => (
                        <a
                          key={exam.id}
                          href={`#exams`}
                          onClick={() => {
                            const el = document.getElementById(`exam-${exam.id}`);
                            el?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                          className="group flex items-start gap-3 rounded-xl p-3 hover:bg-alo-soft-blue transition-colors"
                        >
                          <div
                            className={cn(
                              "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white",
                              exam.accent === "orange"
                                ? "bg-alo-orange"
                                : exam.accent === "royal"
                                ? "bg-alo-royal"
                                : "bg-alo-blue"
                            )}
                          >
                            <GraduationCap className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-alo-navy group-hover:text-alo-blue">
                              {exam.name}
                            </div>
                            <div className="text-xs text-slate-500 line-clamp-1">
                              {exam.tagline}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                {NAV_LINKS.slice(1).map((link) => (
                  <NavigationMenuItem key={link.href}>
                    <NavigationMenuLink
                      href={link.href}
                      className={navigationMenuTriggerStyle({
                        className:
                          "bg-transparent text-sm font-semibold text-alo-navy hover:bg-alo-soft-blue hover:text-alo-blue",
                      })}
                    >
                      {link.label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenAuth("login")}
              className="h-10 px-4 text-sm font-semibold text-alo-navy hover:bg-alo-soft-blue hover:text-alo-blue"
            >
              <LogIn className="mr-1.5 h-4 w-4" />
              Login
            </Button>
            <Button
              onClick={() => onOpenAuth("register")}
              className="h-10 rounded-xl bg-alo-orange px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#d2460f] transition-colors"
            >
              <Sparkles className="mr-1.5 h-4 w-4" />
              Start Free Practice
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden grid h-10 w-10 place-items-center rounded-lg text-alo-navy hover:bg-alo-soft-blue"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-alo-navy hover:bg-alo-soft-blue"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenAuth("login");
                }}
                className="h-11 rounded-xl border-alo-blue/30 text-alo-blue"
              >
                Login
              </Button>
              <Button
                onClick={() => {
                  setMobileOpen(false);
                  onOpenAuth("register");
                }}
                className="h-11 rounded-xl bg-alo-orange text-white hover:bg-[#d2460f]"
              >
                Start Free
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
