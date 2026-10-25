"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Role } from "@/lib/platform-data";

export type View =
  | "public"
  | "student"
  | "admin"
  | "examiner"
  | "ambassador";

type RealUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
};

type AppState = {
  view: View;
  role: Role | null;
  user: RealUser | null;
  authOpen: boolean;
  authMode: "login" | "register";
  loading: boolean;
  setView: (v: View) => void;
  enterPortal: (role: Role, user: RealUser) => void;
  exitPortal: () => void;
  openAuth: (mode: "login" | "register") => void;
  closeAuth: () => void;
  refreshUser: () => Promise<void>;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>("public");
  const [role, setRole] = useState<Role | null>(null);
  const [user, setUser] = useState<RealUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [loading, setLoading] = useState(true);

  // Check real auth status on mount
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.data?.user) {
        const u = data.data.user;
        setUser(u);
        // Map backend role to portal view
        if (u.role === "STUDENT") {
          setRole("student");
          setView("student");
        } else if (u.role === "ADMIN" || u.role === "SUPER_ADMIN") {
          setRole("admin");
          setView("admin");
        } else {
          setRole("student");
          setView("student");
        }
      } else {
        setUser(null);
        setRole(null);
        setView("public");
      }
    } catch {
      setUser(null);
      setRole(null);
      setView("public");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const enterPortal = useCallback((r: Role, u: RealUser) => {
    setRole(r);
    setUser(u);
    setView(r);
    setAuthOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const exitPortal = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
    setRole(null);
    setView("public");
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const openAuth = useCallback((mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => setAuthOpen(false), []);

  return (
    <AppContext.Provider
      value={{ view, role, user, authOpen, authMode, loading, setView, enterPortal, exitPortal, openAuth, closeAuth, refreshUser }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
