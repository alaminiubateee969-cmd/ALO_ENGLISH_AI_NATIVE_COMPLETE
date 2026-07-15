"use client";

import { useState, useCallback } from "react";
import {
  Bot, BookOpen, Baby, Video, UserCircle, Mic, Image as ImageIcon,
  Presentation, Megaphone, Share2, Workflow, BarChart3, Settings,
  GraduationCap, Lock, type LucideIcon,
} from "lucide-react";
import type { Role } from "./role-context";

export type ModuleId =
  | "home" | "agents" | "research" | "education" | "parenting"
  | "courses" | "video" | "avatar" | "voice" | "image"
  | "presentation" | "marketing" | "social" | "workflow" | "analytics" | "admin"
  | "english-test";

export type ModuleDef = {
  id: ModuleId;
  name: string;
  icon: LucideIcon;
  color: string;
  desc: string;
  category: string;
  hidden?: boolean;
  allowedRoles?: Role[];
};

export const MODULES: ModuleDef[] = [
  { id: "agents", name: "AI Agent Center", icon: Bot, color: "#6366F1", desc: "Create unlimited AI agents", category: "Core" },
  { id: "research", name: "Research Center", icon: BookOpen, color: "#0EA5E9", desc: "Literature review, gap analysis", category: "Core" },
  { id: "education", name: "Education Center", icon: BookOpen, color: "#16A34A", desc: "AI tutors, courses, quizzes", category: "Core" },
  { id: "parenting", name: "Parenting Center", icon: Baby, color: "#EC4899", desc: "Child development, parenting guide", category: "Core" },
  { id: "courses", name: "Course Builder", icon: BookOpen, color: "#F59E0B", desc: "Auto-generate courses", category: "Create" },
  { id: "video", name: "Video Generator", icon: Video, color: "#EF4444", desc: "Educational videos with scripts", category: "Create" },
  { id: "avatar", name: "Avatar Studio", icon: UserCircle, color: "#8B5CF6", desc: "Talking AI presenter", category: "Create" },
  { id: "voice", name: "Voice Studio", icon: Mic, color: "#06B6D4", desc: "AI voices with emotion", category: "Create" },
  { id: "image", name: "Image Studio", icon: ImageIcon, color: "#F97316", desc: "Educational images", category: "Create" },
  { id: "presentation", name: "Presentation Studio", icon: Presentation, color: "#3B82F6", desc: "Auto-generate slides", category: "Create" },
  { id: "marketing", name: "Marketing Center", icon: Megaphone, color: "#E8501A", desc: "Posts, captions, campaigns", category: "Automate" },
  { id: "social", name: "Social Automation", icon: Share2, color: "#10B981", desc: "Schedule to 13+ platforms", category: "Automate" },
  { id: "workflow", name: "Workflow Automation", icon: Workflow, color: "#6366F1", desc: "Chain AI tasks", category: "Automate" },
  { id: "analytics", name: "Analytics", icon: BarChart3, color: "#0EA5E9", desc: "Usage, performance, engagement", category: "Manage" },
  { id: "admin", name: "Admin Dashboard", icon: Settings, color: "#64748B", desc: "Users, roles, API keys", category: "Manage" },
  // HIDDEN MODULE — only visible to Super Admin and Country Manager
  {
    id: "english-test", name: "English Test Platform", icon: GraduationCap, color: "#0057B8",
    desc: "english.aloeducation.com — full exam system (hidden, powered by AI OS)",
    category: "Hidden",
    hidden: true,
    allowedRoles: ["super_admin", "country_manager"],
  },
];

export function useModule() {
  const [active, setActive] = useState<ModuleId>("home");
  const navigate = useCallback((id: ModuleId) => {
    setActive(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  return { active, navigate };
}

export function isModuleVisible(mod: ModuleDef, role: Role): boolean {
  if (!mod.hidden) return true;
  if (!mod.allowedRoles) return false;
  return mod.allowedRoles.includes(role);
}
