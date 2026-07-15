"use client";

import { useState, useEffect } from "react";
import {
  Menu, X, Sparkles, Home as HomeIcon,
  ChevronRight, Globe, Lock, ShieldCheck, Crown,
  LogOut, LogIn, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// V11 — Public English exam system (everyone sees this)
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
import type { ExamType } from "@/lib/question-bank";

// AI OS — Hidden portal (Super Admin + Country Manager only)
import { MODULES, useModule, isModuleVisible, type ModuleId } from "@/components/ai-os/module-registry";
import Home from "@/components/ai-os/home";
import Agents from "@/components/ai-os/agents";
import Research from "@/components/ai-os/research";
import Education from "@/components/ai-os/education";
import Parenting from "@/components/ai-os/parenting";
import Courses from "@/components/ai-os/courses";
import VideoGen from "@/components/ai-os/video";
import Avatar from "@/components/ai-os/avatar";
import Voice from "@/components/ai-os/voice";
import ImageStudio from "@/components/ai-os/image";
import PresentationStudio from "@/components/ai-os/presentation";
import Marketing from "@/components/ai-os/marketing";
import Social from "@/components/ai-os/social";
import WorkflowAuto from "@/components/ai-os/workflow";
import Analytics from "@/components/ai-os/analytics";
import Admin from "@/components/ai-os/admin";

type Role = "super_admin" | "country_manager" | "public";

const AI_OS_COMPONENTS: Record<ModuleId, React.ComponentType<{ navigate: (id: ModuleId) => void }>> = {
  home: Home, agents: Agents, research: Research, education: Education,
  parenting: Parenting, courses: Courses, video: VideoGen, avatar: Avatar,
  voice: Voice, image: ImageStudio, presentation: PresentationStudio,
  marketing: Marketing, social: Social, workflow: WorkflowAuto,
  analytics: Analytics, admin: Admin,
  "english-test": () => null, // handled separately
};

// =====================================================
// V11 — PUBLIC ENGLISH EXAM SYSTEM
// =====================================================
function PublicEnglishPlatform({ onStaffLogin }: { onStaffLogin: () => void }) {
  const { view, openAuth, exitPortal } = useAloApp();

  if (view === "student") return <StudentPortal onExit={exitPortal} />;
  if (view === "admin") return <AdminPortal onExit={exitPortal} />;
  if (view === "examiner") return <ExaminerPortal onExit={exitPortal} />;
  if (view === "ambassador") return <AmbassadorPortal onExit={exitPortal} />;

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
      {/* Hidden staff access — disguised as version number */}
      <button
        onClick={onStaffLogin}
        className="fixed bottom-1 right-2 z-40 text-[9px] text-slate-300 hover:text-slate-500 transition-colors"
        aria-label="system status"
      >
        v11.0 · System Status
      </button>
    </div>
  );
}

// =====================================================
// STAFF LOGIN SCREEN
// =====================================================
function StaffLogin({ onLogin, onBack }: { onLogin: (role: Role) => void; onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("super_admin");

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-4 w-4" /> Back to English Platform
        </button>
        <div className="text-center mb-8">
          <div className="grid h-14 w-14 mx-auto place-items-center rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white shadow-lg">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Staff Portal</h1>
          <p className="mt-1 text-sm text-slate-500">Authorized personnel only</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(role); }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Role</Label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setRole("super_admin")} className={cn("rounded-xl border-2 p-3 text-left transition-all", role === "super_admin" ? "border-[#E8501A] bg-orange-50" : "border-slate-200")}>
                <Crown className="h-4 w-4 text-[#E8501A]" />
                <div className="mt-1 text-xs font-bold text-slate-700">Super Admin</div>
              </button>
              <button type="button" onClick={() => setRole("country_manager")} className={cn("rounded-xl border-2 p-3 text-left transition-all", role === "country_manager" ? "border-[#0057B8] bg-blue-50" : "border-slate-200")}>
                <ShieldCheck className="h-4 w-4 text-[#0057B8]" />
                <div className="mt-1 text-xs font-bold text-slate-700">Country Manager</div>
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@aloeducation.com" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="h-11 rounded-xl" />
          </div>
          <Button type="submit" className="w-full h-12 rounded-xl bg-[#6366F1] text-white font-semibold hover:bg-[#5558E0]">
            <LogIn className="mr-2 h-4 w-4" /> Sign In
          </Button>
          <p className="text-center text-[11px] text-slate-400">Restricted access. Unauthorized use prohibited.</p>
        </form>
      </div>
    </div>
  );
}

// =====================================================
// AI OS SHELL — Only for Super Admin & Country Manager
// =====================================================
function AIOSShell({ role, onLogout }: { role: Role; onLogout: () => void }) {
  const { active, navigate } = useModule();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const ActiveComponent = AI_OS_COMPONENTS[active];
  const visibleModules = MODULES.filter(m => isModuleVisible(m, role));
  const roleInfo = role === "super_admin"
    ? { label: "Super Admin", icon: Crown, color: "#E8501A" }
    : { label: "Country Manager", icon: ShieldCheck, color: "#0057B8" };
  const RoleIcon = roleInfo.icon;

  return (
    <div className="min-h-screen bg-white flex">
      <aside className={cn("fixed lg:sticky top-0 left-0 z-50 h-screen w-72 shrink-0 border-r border-slate-200 bg-white transition-transform duration-300", sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <button onClick={() => navigate("home")} className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white shadow-md">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-extrabold text-ai-navy">AI Education</div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Research & Media OS</div>
              </div>
            </button>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-100">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>
          <div className="px-3 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ backgroundColor: roleInfo.color }}>
                <RoleIcon className="h-4 w-4" />
              </div>
              <div><div className="text-xs font-bold text-slate-700">{roleInfo.label}</div></div>
            </div>
            <button onClick={onLogout} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-500">
              <LogOut className="h-3 w-3" /> Sign out to English Platform
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
            <button onClick={() => navigate("home")} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all", active === "home" ? "bg-[#6366F1] text-white shadow-md" : "text-slate-600 hover:bg-slate-50")}>
              <HomeIcon className="h-4 w-4" /> Home
            </button>
            <div className="pt-4 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Modules</div>
            {visibleModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <button key={mod.id} onClick={() => navigate(mod.id)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all", active === mod.id ? "bg-slate-100 text-ai-navy shadow-sm" : "text-slate-600 hover:bg-slate-50", mod.hidden && "border-l-2 border-amber-400")}>
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white" style={{ backgroundColor: mod.color }}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate">{mod.name}</span>
                  {mod.hidden && <Lock className="ml-auto h-3 w-3 text-amber-500" />}
                  {active === mod.id && !mod.hidden && <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />}
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-400"><Globe className="h-3.5 w-3.5" /><span>EN · BN · AR · HI · ES · FR</span></div>
          </div>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100"><Menu className="h-5 w-5 text-slate-600" /></button>
          <div className="flex items-center gap-2"><div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white"><Sparkles className="h-4 w-4" /></div><span className="text-sm font-bold text-ai-navy">AI OS</span></div>
          <div className="w-9" />
        </header>
        <main className="flex-1"><ActiveComponent navigate={navigate} /></main>
      </div>
    </div>
  );
}

// =====================================================
// MAIN — Routes between public and private
// =====================================================
function AppContent() {
  const [staffRole, setStaffRole] = useState<Role | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  // Staff logged in → show AI OS
  if (staffRole && staffRole !== "public") {
    return <AIOSShell role={staffRole} onLogout={() => { setStaffRole(null); setShowLogin(false); }} />;
  }

  // Staff login screen
  if (showLogin) {
    return <StaffLogin onLogin={(role) => setStaffRole(role)} onBack={() => setShowLogin(false)} />;
  }

  // Default: public English exam platform (V11)
  return <PublicEnglishPlatform onStaffLogin={() => setShowLogin(true)} />;
}

export default function Page() {
  return (
    <AloAppProvider>
      <AppContent />
    </AloAppProvider>
  );
}
