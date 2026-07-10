"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Role } from "@/lib/platform-data";

export type View =
  | "public"
  | "student"
  | "admin"
  | "examiner"
  | "ambassador";

type AppState = {
  view: View;
  role: Role | null;
  authOpen: boolean;
  authMode: "login" | "register";
  setView: (v: View) => void;
  enterPortal: (role: Role) => void;
  exitPortal: () => void;
  openAuth: (mode: "login" | "register") => void;
  closeAuth: () => void;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>("public");
  const [role, setRole] = useState<Role | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");

  const enterPortal = useCallback((r: Role) => {
    setRole(r);
    setView(r);
    setAuthOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const exitPortal = useCallback(() => {
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
      value={{ view, role, authOpen, authMode, setView, enterPortal, exitPortal, openAuth, closeAuth }}
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
