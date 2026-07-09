"use client";

import { useState, useCallback } from "react";
import { AloNavbar } from "@/components/alo/navbar";
import { AloHero } from "@/components/alo/hero";
import { AloExamTypes } from "@/components/alo/exam-types";
import { AloFreeQuota } from "@/components/alo/free-quota";
import { AloMockTestSection } from "@/components/alo/mock-test-demo";
import { AloSpeakingPractice, AloWritingEvaluation } from "@/components/alo/speaking-writing";
import { AloDashboardPreview } from "@/components/alo/dashboard-preview";
import { AloPricing, AloAmbassador, AloCrmIntegration } from "@/components/alo/pricing-ambassador-crm";
import { AloHowItWorks } from "@/components/alo/how-it-works";
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

  const scrollToMockTests = useCallback(() => {
    const el = document.getElementById("mock-tests");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Slight delay then trigger the demo start button
    setTimeout(() => {
      const startBtn = document.querySelector<HTMLButtonElement>("#mock-tests button");
      // The first button in mock-tests section that says "Launch Mock Test Demo" — we just scroll.
    }, 300);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AloNavbar onOpenAuth={openAuth} />

      <main className="flex-1">
        <AloHero onStart={() => openAuth("register")} onOpenAuth={openAuth} />
        <AloExamTypes onStart={() => openAuth("register")} />
        <AloHowItWorks onStart={() => openAuth("register")} />
        <AloFreeQuota onVerify={() => openAuth("register")} />
        <AloMockTestSection onStart={() => openAuth("register")} />
        <AloSpeakingPractice />
        <AloWritingEvaluation />
        <AloDashboardPreview onOpenAuth={openAuth} />
        <AloPricing onOpenAuth={openAuth} />
        <AloAmbassador />
        <AloCrmIntegration />
        <AloTestimonials />
        <AloFaq />
        <AloLeadCapture />
        <AloFinalCta onStart={() => openAuth("register")} />
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
