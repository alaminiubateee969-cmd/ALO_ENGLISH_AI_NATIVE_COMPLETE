"use client";

import { AppProvider, useApp } from "@/components/alo/app-shell";
import { AloAuthModal } from "@/components/alo/auth-modal";
import { AloNavbar } from "@/components/alo/navbar";
import { AloFooter } from "@/components/alo/footer";
import {
  PublicHero, PublicExams, PublicFreeQuota, PublicMockTests, PublicPricing,
  PublicAmbassador, PublicCrmIntegration, PublicTestimonials, PublicFaq,
  PublicLeadCapture, PublicFinalCta,
} from "@/components/alo/public-sections";
import { StudentPortal } from "@/components/alo/student-portal";
import { AdminPortal, ExaminerPortal, AmbassadorPortal } from "@/components/alo/portals";

function AppContent() {
  const { view, openAuth, exitPortal } = useApp();

  if (view === "student") return <StudentPortal onExit={exitPortal} />;
  if (view === "admin") return <AdminPortal onExit={exitPortal} />;
  if (view === "examiner") return <ExaminerPortal onExit={exitPortal} />;
  if (view === "ambassador") return <AmbassadorPortal onExit={exitPortal} />;

  // Public site
  const handleFooterAction = (action: string) => {
    if (action.startsWith("portal:")) {
      const role = action.split(":")[1] as "student" | "admin" | "examiner" | "ambassador";
      openAuth("login");
      // The auth modal default role selection; user picks the role there.
      return;
    }
    const el = document.getElementById(action);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AloNavbar />
      <main className="flex-1">
        <PublicHero />
        <PublicExams onStart={() => openAuth("register")} />
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

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
