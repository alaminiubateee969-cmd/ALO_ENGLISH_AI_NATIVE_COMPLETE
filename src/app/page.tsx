"use client";

import { useState } from "react";
import { AppProvider as AloAppProvider, useApp as useAloApp } from "@/components/alo/app-shell";
import { AloAuthModal } from "@/components/alo/auth-modal";
import { AloNavbar } from "@/components/alo/navbar";
import { AloFooter } from "@/components/alo/footer";
import {
  PublicHero, PublicFreeQuota, PublicMockTests, PublicPricing,
  PublicAmbassador, PublicCrmIntegration, PublicTestimonials, PublicFaq,
  PublicLeadCapture, PublicFinalCta,
} from "@/components/alo/public-sections";
import { CbtExamCatalog } from "@/components/alo/cbt-catalog";
import { StudentPortal } from "@/components/alo/student-portal";
import { AdminPortal, ExaminerPortal, AmbassadorPortal } from "@/components/alo/portals";
import { MockTestEngine } from "@/components/alo/mock-test-engine";
import type { ExamType } from "@/lib/question-bank";
import { Loader2 } from "lucide-react";

function EnglishPlatform() {
  const { view, openAuth, exitPortal, user, loading } = useAloApp();
  const [activeExam, setActiveExam] = useState<ExamType | null>(null);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-alo-blue" />
      </div>
    );
  }

  // If taking a mock test
  if (activeExam && view === "student") {
    return (
      <div className="min-h-screen bg-slate-50">
        <MockTestEngine
          initialExam={activeExam}
          onExit={() => { setActiveExam(null); }}
        />
      </div>
    );
  }

  // Student portal
  if (view === "student" && user) {
    return (
      <StudentPortal
        user={user}
        onExit={exitPortal}
        onStartExam={(et: ExamType) => setActiveExam(et)}
      />
    );
  }

  // Admin portal
  if (view === "admin" && user) {
    return <AdminPortal onExit={exitPortal} />;
  }

  // Examiner portal
  if (view === "examiner" && user) {
    return <ExaminerPortal onExit={exitPortal} />;
  }

  // Ambassador portal
  if (view === "ambassador" && user) {
    return <AmbassadorPortal onExit={exitPortal} />;
  }

  // Public page
  const handleFooterAction = (action: string) => {
    if (action.startsWith("portal:")) { openAuth("login"); return; }
    const el = document.getElementById(action);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const startExam = (_examType: ExamType | null, _slug: string) => {
    openAuth("register");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AloNavbar />
      <main className="flex-1">
        <PublicHero />
        <CbtExamCatalog onStartExam={startExam} />
        <PublicFreeQuota onVerify={() => openAuth("register")} />
        <PublicMockTests onStart={() => openAuth("register")} />
        <PublicPricing onStart={() => openAuth("register")} />
        <PublicAmbassador onEnter={() => openAuth("login")} />
        <PublicCrmIntegration />
        <PublicTestimonials />
        <PublicFaq />
        <PublicLeadCapture />
        <PublicFinalCta onStart={() => openAuth("register")} />
      </main>
      <AloFooter onAction={handleFooterAction} />
      <AloAuthModal />
    </div>
  );
}

export default function Page() {
  return (
    <AloAppProvider>
      <EnglishPlatform />
    </AloAppProvider>
  );
}
