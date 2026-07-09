"use client";

import { useState, useEffect } from "react";
import { GraduationCap, X, Mail, Lock, User, Phone, ShieldCheck, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export function AloAuthModal({
  open,
  mode,
  onClose,
  onModeChange,
}: {
  open: boolean;
  mode: "login" | "register";
  onClose: () => void;
  onModeChange: (mode: "login" | "register") => void;
}) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast({
        title: mode === "login" ? "Login successful (demo)" : "Account created (demo)",
        description: mode === "register" ? "Welcome to ALO Education. Your free consultation is unlocked." : "Welcome back to ALO Education.",
      });
      onClose();
    }, 900);
  };

  const portals = [
    { l: "Student Portal", d: "Dashboard, applications, AI tools" },
    { l: "Partner Portal", d: "Referrals, students, applications" },
    { l: "Employee Login", d: "Counselor workspace" },
    { l: "CRM Dashboard", d: "Staff & admin only" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-alo-navy/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto alo-scroll">
        {/* Header */}
        <div className="relative alo-gradient-navy p-6">
          <button onClick={onClose} className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20" aria-label="close">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white"><GraduationCap className="h-5 w-5" /></div>
            <div>
              <div className="text-base font-extrabold text-white">ALO <span className="text-alo-orange">Education</span></div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-white/60">Study Abroad · CRM</div>
            </div>
          </div>
          <h3 className="mt-4 text-xl font-extrabold text-white">{mode === "login" ? "Welcome back" : "Create your free account"}</h3>
          <p className="text-sm text-slate-300 mt-1">{mode === "login" ? "Access your portal and admission journey." : "Start with a free consultation. No card required."}</p>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Portal quick tabs */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {portals.map((p, i) => (
              <button key={p.l} className={`rounded-xl border p-2.5 text-left ${i === 0 ? "border-alo-blue bg-alo-soft-blue" : "border-slate-200 hover:bg-slate-50"}`}>
                <div className={`text-xs font-bold ${i === 0 ? "text-alo-blue" : "text-alo-navy"}`}>{p.l}</div>
                <div className="text-[10px] text-alo-faint">{p.d}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
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
            {mode === "register" && (
              <div className="flex items-start gap-2">
                <Checkbox id="terms" className="mt-0.5" required />
                <Label htmlFor="terms" className="text-xs text-alo-faint leading-relaxed">
                  I agree to the Terms, Privacy Policy and Exam Disclaimer. Practice tests are preparation tools only.
                </Label>
              </div>
            )}
            <Button type="submit" disabled={submitting} className="w-full h-12 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#cc3f10] disabled:opacity-50">
              {submitting ? "Please wait…" : mode === "login" ? (<><ShieldCheck className="mr-2 h-4 w-4" />Login to Portal</>) : (<><Sparkles className="mr-2 h-4 w-4" />Create Free Account</>)}
            </Button>
          </form>
          <div className="mt-5 text-center text-sm text-alo-faint">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => onModeChange(mode === "login" ? "register" : "login")} className="font-semibold text-alo-blue hover:underline">
              {mode === "login" ? "Register free" : "Login"}
            </button>
          </div>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-alo-faint">
            <ShieldCheck className="h-3.5 w-3.5 text-alo-success" />
            Secured · CSRF protected · audit-logged
          </div>
        </div>
      </div>
    </div>
  );
}
