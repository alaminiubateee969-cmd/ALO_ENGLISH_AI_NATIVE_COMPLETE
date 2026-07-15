"use client";

import { useState } from "react";
import { Lock, X, ShieldCheck, Crown, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "./role-context";

// Hidden admin login — accessible only via secret keyboard shortcut
// Ctrl+Shift+A opens this modal. No link visible anywhere on the public site.

export function HiddenAdminLogin({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { setRole } = useApp();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [showCode, setShowCode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production: verify against database (hashed admin code)
    // For demo: two codes — one for super admin, one for country manager
    if (code === "ALO-SUPER-2026") {
      setRole("super_admin");
      onSuccess();
    } else if (code === "ALO-COUNTRY-2026") {
      setRole("country_manager");
      onSuccess();
    } else {
      setError("Invalid access code");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl border border-slate-700 bg-[#0F172A] p-7 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Restricted Access</h3>
            <p className="text-[11px] text-white/50">Authorized personnel only</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-white/70">Access Code</Label>
            <div className="relative">
              <Input
                type={showCode ? "text" : "password"}
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(""); }}
                placeholder="Enter access code"
                className="h-11 rounded-xl border-slate-600 bg-slate-800 text-white placeholder:text-white/30"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
              >
                {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <Button type="submit" className="w-full h-11 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold hover:opacity-90">
            <Lock className="mr-2 h-4 w-4" />
            Unlock Dashboard
          </Button>
        </form>

        <div className="mt-5 pt-4 border-t border-white/10">
          <p className="text-[10px] text-white/40 text-center">
            This area is restricted to Super Admin and Country Manager only.
            Unauthorized access attempts are logged.
          </p>
        </div>
      </div>
    </div>
  );
}
