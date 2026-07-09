"use client";

import { useState, useEffect } from "react";
import { GraduationCap, X, Mail, Lock, User, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
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
  const [aloId, setAloId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast({
        title: mode === "login" ? "Login successful (demo)" : "Account created (demo)",
        description:
          mode === "register"
            ? "Your free mock test quota is now active. ALO students get 3 free mocks."
            : "Welcome back to ALO English Test Platform.",
      });
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-alo-navy/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-alo-navy to-alo-blue p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20"
            aria-label="close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-extrabold text-white">
                ALO <span className="text-alo-orange">English</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-white/60">
                Test Platform
              </div>
            </div>
          </div>
          <h3 className="mt-4 text-xl font-extrabold text-white">
            {mode === "login" ? "Welcome back" : "Create your free account"}
          </h3>
          <p className="text-sm text-slate-300 mt-1">
            {mode === "login"
              ? "Access your mock tests, scores and counselor."
              : "Start with free mock tests. ALO students get 3 free."}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="fullname" className="text-xs font-semibold text-alo-navy">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input id="fullname" required placeholder="Your full name" className="h-11 rounded-xl border-slate-200 pl-9" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-alo-navy">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="email" type="email" required placeholder="you@example.com" className="h-11 rounded-xl border-slate-200 pl-9" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-alo-navy">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="password" type="password" required placeholder="••••••••" className="h-11 rounded-xl border-slate-200 pl-9" />
              </div>
            </div>

            {mode === "register" && (
              <div className="rounded-xl border border-alo-blue/20 bg-alo-soft-blue/50 p-3.5">
                <Label htmlFor="aloId" className="text-xs font-semibold text-alo-navy flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-alo-blue" />
                  ALO Student ID (optional)
                </Label>
                <Input
                  id="aloId"
                  value={aloId}
                  onChange={(e) => setAloId(e.target.value)}
                  placeholder="e.g. AE-2026000001"
                  className="mt-1.5 h-10 rounded-lg border-slate-200 font-mono text-sm"
                />
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Verify your ALO Education student ID to unlock 3 free mock tests + benefits.
                </p>
              </div>
            )}

            {mode === "register" && (
              <div className="flex items-start gap-2">
                <Checkbox id="terms" className="mt-0.5" required />
                <Label htmlFor="terms" className="text-xs text-slate-500 leading-relaxed">
                  I agree to the Terms, Privacy Policy and Exam Disclaimer. Practice tests are
                  preparation tools only — scores are estimates, not official results.
                </Label>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#d2460f] disabled:opacity-50"
            >
              {submitting ? (
                "Please wait…"
              ) : mode === "login" ? (
                "Login to Dashboard"
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Free Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-slate-500">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => onModeChange(mode === "login" ? "register" : "login")}
              className="font-semibold text-alo-blue hover:underline"
            >
              {mode === "login" ? "Register free" : "Login"}
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Secured with CSRF protection · rate-limited · audit-logged
          </div>
        </div>
      </div>
    </div>
  );
}
