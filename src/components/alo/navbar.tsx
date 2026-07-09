"use client";

import { useEffect, useState } from "react";
import {
  Menu,
  X,
  ChevronDown,
  GraduationCap,
  Sparkles,
  Phone,
  MapPin,
  Building2,
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
import { DESTINATIONS } from "@/lib/alo-data";

export function AloNavbar({ onOpenAuth }: { onOpenAuth: (mode: "login" | "register") => void }) {
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
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-slate-200/80 alo-shadow-sm"
          : "bg-white/60 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <button onClick={() => scrollTo("top")} className="flex items-center gap-2.5 shrink-0">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-alo-blue text-white alo-shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="leading-tight text-left">
              <div className="text-[15px] font-extrabold tracking-tight text-alo-navy">
                ALO <span className="text-alo-orange">Education</span>
              </div>
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-alo-faint">
                Study Abroad · CRM
              </div>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    onClick={() => scrollTo("destinations")}
                    className="bg-transparent text-sm font-semibold text-alo-navy hover:bg-alo-soft-blue data-[state=open]:bg-alo-soft-blue"
                  >
                    Destinations
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[520px] gap-1 p-3 md:grid-cols-2">
                      {DESTINATIONS.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => scrollTo("destinations")}
                          className="group flex items-center gap-3 rounded-xl p-2.5 hover:bg-alo-soft-blue transition-colors text-left"
                        >
                          <span className="text-2xl">{d.flag}</span>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-alo-navy group-hover:text-alo-blue">{d.name}</div>
                            <div className="text-xs text-alo-faint line-clamp-1">{d.tagline}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {[
                  { label: "Course Finder", id: "course-finder" },
                  { label: "Services", id: "services" },
                  { label: "Language Prep", id: "language-prep" },
                  { label: "Scholarships", id: "scholarships" },
                  { label: "Portals", id: "portals" },
                  { label: "Contact", id: "contact" },
                ].map((link) => (
                  <NavigationMenuItem key={link.id}>
                    <NavigationMenuLink
                      onClick={() => scrollTo(link.id)}
                      className={navigationMenuTriggerStyle({
                        className:
                          "bg-transparent text-sm font-semibold text-alo-navy hover:bg-alo-soft-blue hover:text-alo-blue cursor-pointer",
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
            <button
              onClick={() => onOpenAuth("login")}
              className="h-11 rounded-xl px-4 text-sm font-semibold text-alo-blue hover:bg-alo-soft-blue"
            >
              Login
            </button>
            <Button
              onClick={() => scrollTo("contact")}
              className="h-12 rounded-xl bg-alo-orange px-5 text-sm font-semibold text-white alo-shadow-orange hover:bg-[#cc3f10] transition-colors"
            >
              <Phone className="mr-1.5 h-4 w-4" />
              Book Free Consultation
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
        <div className="lg:hidden border-t border-slate-200 bg-white max-h-[80vh] overflow-y-auto alo-scroll">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
            {[
              { label: "Destinations", id: "destinations" },
              { label: "Course Finder", id: "course-finder" },
              { label: "Services", id: "services" },
              { label: "Scholarships", id: "scholarships" },
              { label: "Language Prep", id: "language-prep" },
              { label: "Portals", id: "portals" },
              { label: "Contact", id: "contact" },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="block w-full text-left rounded-lg px-3 py-2.5 text-sm font-semibold text-alo-navy hover:bg-alo-soft-blue"
              >
                {link.label}
              </button>
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
                onClick={() => scrollTo("contact")}
                className="h-11 rounded-xl bg-alo-orange text-white hover:bg-[#cc3f10]"
              >
                Book Free
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
