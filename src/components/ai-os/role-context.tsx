"use client";

import { useState, useCallback, createContext, useContext, type ReactNode } from "react";

export type Role = "super_admin" | "country_manager" | "public";

export type UserSession = {
  role: Role;
  name: string;
  email: string;
  isAuthenticated: boolean;
};

type AppContextType = {
  session: UserSession;
  login: (role: Role, name: string, email: string) => void;
  logout: () => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession>({
    role: "public",
    name: "",
    email: "",
    isAuthenticated: false,
  });

  const login = useCallback((role: Role, name: string, email: string) => {
    setSession({ role, name, email, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    setSession({ role: "public", name: "", email: "", isAuthenticated: false });
  }, []);

  return (
    <AppContext.Provider value={{ session, login, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

// ONLY super_admin and country_manager can see the AI OS
export function canAccessAIOS(role: Role): boolean {
  return role === "super_admin" || role === "country_manager";
}
