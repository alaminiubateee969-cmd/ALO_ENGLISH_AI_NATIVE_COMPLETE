"use client";

import { useState, useEffect } from "react";
import { X, Mail, Lock, User, Phone, ShieldCheck, Sparkles, GraduationCap, Briefcase, Users, LayoutDashboard, ChevronRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [selectedRole, setSelectedRole] = useState<Role>("student");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (authMode === "register") {
        // Real register API call
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          setError(data.message || "Registration failed");
          setSubmitting(false);
          return;
        }
        // After register, enter student portal
        enterPortal(selectedRole, data.data.user);
      } else {
        // Real login API call
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          setError(data.message || "Login failed");
          setSubmitting(false);
          return;
        }
        // Map backend role to portal
        const user = data.data.user;
        let portalRole: Role = "student";
        if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") portalRole = "admin";
        enterPortal(portalRole, user);
      }
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
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
            <div className="h-10 w-10 rounded-lg bg-white/10 p-1 flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">ALO</span>
            </div>
            <div>
              <div className="text-base font-extrabold text-white">ALO <span className="text-alo-orange">English</span></div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-white/60">Test Platform</div>
            </div>
          </div>
          <h3 className="mt-4 text-xl font-extrabold text-white">{authMode === "login" ? "Welcome back" : "Create your free account"}</h3>
          <p className="text-sm text-slate-300 mt-1">{authMode === "login" ? "Login to access your portal" : "Register to start free practice tests"}</p>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Role selector (login only) */}
          {authMode === "login" && (
            <div className="mb-5">
              <Label className="text-xs font-bold uppercase tracking-wide text-alo-faint mb-2 block">Select portal</Label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => {
                  const Icon = ROLE_ICONS[r.id];
                  const sel = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
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
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {authMode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fullname" className="text-xs font-semibold text-alo-navy">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-faint" />
                    <Input
                      id="fullname"
                      required
                      placeholder="Your name"
                      className="h-11 rounded-xl border-slate-200 pl-9"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-alo-navy">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-faint" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+880..."
                      className="h-11 rounded-xl border-slate-200 pl-9"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-alo-navy">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-faint" />
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="h-11 rounded-xl border-slate-200 pl-9"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-alo-navy">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-faint" />
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={12}
                  placeholder="Min 12 characters"
                  className="h-11 rounded-xl border-slate-200 pl-9"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-alo-orange text-white font-bold hover:bg-alo-orange/90 disabled:opacity-50"
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {authMode === "login" ? "Logging in..." : "Creating account..."}</>
              ) : (
                <>{authMode === "login" ? "Login" : "Create Account"} <ChevronRight className="ml-1 h-4 w-4" /></>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-alo-faint">
            {authMode === "login" ? (
              <>Don't have an account? <button onClick={() => openAuth("register")} className="font-semibold text-alo-blue hover:underline">Register free</button></>
            ) : (
              <>Already have an account? <button onClick={() => openAuth("login")} className="font-semibold text-alo-blue hover:underline">Login</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
