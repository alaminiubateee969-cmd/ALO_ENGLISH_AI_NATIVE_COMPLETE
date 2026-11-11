"use client";

import { useState, useEffect } from "react";
import { X, Mail, Lock, User, Phone, ShieldCheck, Sparkles, GraduationCap, Briefcase, Users, LayoutDashboard, ChevronRight, Check, IdCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "./app-shell";
import { ROLES, type Role } from "@/lib/platform-data";

const ROLE_ICONS: Record<Role, any> = {
  student: GraduationCap,
  admin: LayoutDashboard,
  examiner: Users,
  ambassador: Briefcase,
};

export function AloAuthModal() {
  const { authOpen, authMode, closeAuth, enterPortal, openAuth } = useApp();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<Role>("student");
  const [submitting, setSubmitting] = useState(false);
  // Educational ID is required to register as a student (the platform is
  // gated — not public). Tracked here so the modal's demo handler can
  // validate it and the field is visible to the user, mirroring the real
  // /register page form in src/components/site/auth-forms.tsx.
  const [educationalId, setEducationalId] = useState("");

  useEffect(() => {
    if (authOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [authOpen]);

  if (!authOpen) return null;

  const isStudentRegister = authMode === "register" && selectedRole === "student";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStudentRegister && !educationalId.trim()) {
      toast({
        title: "Educational ID required",
        description:
          "The ALO exam platform is not public. Students can only register with the educational ID issued by their branch or counselor.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast({
        title: `${authMode === "login" ? "Login" : "Account created"} (demo)`,
        description: `Entering ${ROLES.find((r) => r.id === selectedRole)?.name}${
          isStudentRegister && educationalId ? ` · Edu ID ${educationalId.toUpperCase()}` : ""
        }. No real auth in this preview — use the /register page for a real account.`,
      });
      enterPortal(selectedRole);
      setEducationalId("");
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-alo-navy/60 backdrop-blur-sm" onClick={closeAuth} />
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[94vh] overflow-y-auto alo-scroll">
        {/* Header */}
        <div className="relative alo-gradient-navy p-6">
          <button onClick={closeAuth} className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20" aria-label="close">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <img src="/images/alo-logo.webp" alt="ALO Education logo" className="h-10 w-10 rounded-lg bg-white/10 p-1 object-contain" />
            <div>
              <div className="text-base font-extrabold text-white">ALO <span className="text-alo-orange">English</span></div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-white/60">Test Platform</div>
            </div>
          </div>
          <h3 className="mt-4 text-xl font-extrabold text-white">{authMode === "login" ? "Welcome back" : "Create your free account"}</h3>
          <p className="text-sm text-slate-300 mt-1">Choose a portal to enter. No real credentials — this is a live preview.</p>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Role selector */}
          <div className="mb-5">
            <Label className="text-xs font-bold uppercase tracking-wide text-alo-faint mb-2 block">Select portal</Label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => {
                const Icon = ROLE_ICONS[r.id];
                const sel = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    className={cn(
                      "rounded-xl border-2 p-3 text-left transition-all",
                      sel ? "border-alo-blue bg-alo-soft-blue" : "border-slate-200 hover:border-alo-blue/40"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("grid h-8 w-8 place-items-center rounded-lg text-white", sel ? "bg-alo-blue" : "bg-slate-300")} style={!sel ? { backgroundColor: r.accent } : undefined}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={cn("text-xs font-bold", sel ? "text-alo-blue" : "text-alo-navy")}>{r.name}</div>
                      </div>
                      {sel && <Check className="ml-auto h-4 w-4 text-alo-blue" />}
                    </div>
                    <p className="mt-1.5 text-[10px] text-alo-faint leading-tight line-clamp-2">{r.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {authMode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fullname" className="text-xs font-semibold text-alo-navy">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-faint" />
                    <Input id="fullname" required placeholder="Your name" className="h-11 rounded-xl border-slate-200 pl-9" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-alo-navy">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-faint" />
                    <Input id="phone" placeholder="+880…" className="h-11 rounded-xl border-slate-200 pl-9" />
                  </div>
                </div>
              </div>
            )}
            {isStudentRegister && (
              <div className="space-y-1.5">
                <Label htmlFor="educationalId" className="text-xs font-semibold text-alo-navy">
                  Educational ID <span className="text-alo-orange">*</span>
                </Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-faint" />
                  <Input
                    id="educationalId"
                    value={educationalId}
                    onChange={(e) => setEducationalId(e.target.value)}
                    required
                    placeholder="e.g. ALO-2026-0001"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    className="h-11 rounded-xl border-slate-200 pl-9 uppercase tracking-wide"
                  />
                </div>
                <p className="text-[11px] text-alo-faint leading-relaxed">
                  The exam platform is gated. Students register with the educational ID issued by their ALO branch — 3 free mock tests are granted per exam type against this ID.
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-alo-navy">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-faint" />
                <Input id="email" type="email" required placeholder="you@example.com" className="h-11 rounded-xl border-slate-200 pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-alo-navy">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-faint" />
                <Input id="password" type="password" required placeholder="••••••••" className="h-11 rounded-xl border-slate-200 pl-9" />
              </div>
            </div>
            {authMode === "register" && selectedRole === "student" && (
              <div className="flex items-start gap-2">
                <Checkbox id="terms" className="mt-0.5" required />
                <Label htmlFor="terms" className="text-xs text-alo-faint leading-relaxed">
                  I agree to the Terms, Privacy Policy and Exam Disclaimer. Practice tests are preparation tools only — scores are estimates, not official results.
                </Label>
              </div>
            )}
            <Button type="submit" disabled={submitting} className="w-full h-12 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#cc3f10] disabled:opacity-50">
              {submitting ? "Please wait…" : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {authMode === "login" ? `Login to ${ROLES.find((r) => r.id === selectedRole)?.name}` : `Enter ${ROLES.find((r) => r.id === selectedRole)?.name}`}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-alo-faint">
            {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => openAuth(authMode === "login" ? "register" : "login")} className="font-semibold text-alo-blue hover:underline">
              {authMode === "login" ? "Register free" : "Login"}
            </button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-alo-faint">
            <ShieldCheck className="h-3.5 w-3.5 text-alo-success" />
            RBAC · CSRF protected · rate-limited · audit-logged · no demo credentials stored
          </div>
        </div>
      </div>
    </div>
  );
}
