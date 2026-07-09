"use client";

import { useState, useCallback } from "react";
import { AloNavbar } from "@/components/alo/navbar";
import { AloHero } from "@/components/alo/hero";
import { AloDestinations } from "@/components/alo/destinations";
import { AloCourseFinder } from "@/components/alo/course-finder";
import { AloServices, AloWhyAlo, AloScholarships, AloUniversityCarousel, AloJourney, AloAiCounselor } from "@/components/alo/services-journey";
import { AloLanguagePrep } from "@/components/alo/language-prep";
import { AloPortals } from "@/components/alo/portals";
import { AloTestimonials, AloFaq, AloLeadCapture, AloFinalCta } from "@/components/alo/testimonials-faq-lead";
import { AloFooter } from "@/components/alo/footer";
import { AloAuthModal } from "@/components/alo/auth-modal";

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");

  const openAuth = useCallback((mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);

  const scrollToContact = useCallback(() => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AloNavbar onOpenAuth={openAuth} />

      <main className="flex-1">
        <AloHero onStart={scrollToContact} onOpenAuth={openAuth} />
        <AloDestinations onCta={scrollToContact} />
        <AloCourseFinder onCta={scrollToContact} />
        <AloServices onCta={scrollToContact} />
        <AloWhyAlo />
        <AloScholarships onCta={scrollToContact} />
        <AloUniversityCarousel />
        <AloJourney />
        <AloLanguagePrep onCta={scrollToContact} />
        <AloAiCounselor onCta={scrollToContact} />
        <AloPortals onOpenAuth={openAuth} />
        <AloTestimonials />
        <AloFaq />
        <AloLeadCapture />
        <AloFinalCta onStart={scrollToContact} />
      </main>

      <AloFooter />

      <AloAuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeChange={setAuthMode}
      />
    </div>
  );
}
