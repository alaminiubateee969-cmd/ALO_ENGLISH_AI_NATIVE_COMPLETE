"use client";

import { AppProvider, useApp } from "@/components/alo/app-shell";
import { AloAuthModal } from "@/components/alo/auth-modal";
import { AloNavbar } from "@/components/alo/navbar";
import { AloFooter } from "@/components/alo/footer";
import {
  PublicHero, PublicFreeQuota, PublicMockTests, PublicPricing,
  PublicAmbassador, PublicCrmIntegration, PublicTestimonials, PublicFaq,
  PublicLeadCapture, PublicFinalCta,
} from "@/components/alo/public-sections";
import { CbtExamCatalog } from "@/components/alo/cbt-catalog";
import { ProductionDeliverables } from "@/components/alo/production-deliverables";
import { StudentPortal } from "@/components/alo/student-portal";
import { AdminPortal, ExaminerPortal, AmbassadorPortal } from "@/components/alo/portals";
import type { ExamType } from "@/lib/question-bank";

function AppContent() {
  const { view, openAuth, exitPortal } = useApp();

  if (view === "student") return <StudentPortal onExit={exitPortal} />;
  if (view === "admin") return <AdminPortal onExit={exitPortal} />;
  if (view === "examiner") return <ExaminerPortal onExit={exitPortal} />;
  if (view === "ambassador") return <AmbassadorPortal onExit={exitPortal} />;

  // Public site
  const handleFooterAction = (action: string) => {
    if (action.startsWith("portal:")) {
      openAuth("login");
      return;
    }
    const el = document.getElementById(action);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const startExam = (examType: ExamType | null, _slug: string) => {
    // In production this would route to /exam/[slug] with a backend quota check.
    // Here we open the auth modal; the student portal mock test engine loads the examType.
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
        <ProductionDeliverables />
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

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
