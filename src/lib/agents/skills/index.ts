import { findUnsafeClaims } from "./copy-guard";

export { findUnsafeClaims };

export type MarketingSkill = {
  id: string;
  name: string;
  category: string;
  owner: string;
  purpose: string;
  canAutoExecute: boolean;
  status: "active" | "draft" | "paused";
  guardrails: string[];
  steps: string[];
};

export const MARKETING_SKILLS: MarketingSkill[] = [
  {
    id: "social-posts",
    name: "Social Post Generator",
    category: "marketing",
    owner: "system",
    purpose: "Generate social media posts for ALO Education",
    canAutoExecute: true,
    status: "active",
    guardrails: ["No false guarantees", "No official exam claims"],
    steps: ["Analyze topic", "Draft post", "Check copy-guard", "Publish"],
  },
  {
    id: "seo-content",
    name: "SEO Content Writer",
    category: "marketing",
    owner: "system",
    purpose: "Write SEO-optimized blog content",
    canAutoExecute: false,
    status: "active",
    guardrails: ["No keyword stuffing", "Original content only"],
    steps: ["Research keywords", "Write draft", "Check copy-guard", "Submit for review"],
  },
  {
    id: "email-campaign",
    name: "Email Campaign Writer",
    category: "marketing",
    owner: "system",
    purpose: "Create email marketing campaigns",
    canAutoExecute: false,
    status: "draft",
    guardrails: ["No spam", "Include unsubscribe"],
    steps: ["Plan campaign", "Write emails", "Check copy-guard", "Schedule"],
  },
];

export function getSkillStats() {
  return {
    total: MARKETING_SKILLS.length,
    active: MARKETING_SKILLS.filter((s) => s.status === "active").length,
  };
}
