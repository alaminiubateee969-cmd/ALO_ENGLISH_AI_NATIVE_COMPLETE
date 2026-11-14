/**
 * Shared navigation for the Super Admin AI Command Center.
 *
 * Every page in `/super-admin/ai-command-center/` imports this so the
 * sidebar stays consistent and a new page only needs to declare its body.
 */

type NavItem = { label: string; href: string };

export const COMMAND_CENTER_NAV: NavItem[] = [
  { label: "Command Center", href: "/super-admin/ai-command-center" },
  { label: "Departments", href: "/super-admin/ai-command-center/departments" },
  { label: "AI Workforce", href: "/super-admin/ai-command-center/agents" },
  { label: "Skills", href: "/super-admin/ai-command-center/skills" },
  { label: "Prompts", href: "/super-admin/ai-command-center/prompts" },
  { label: "SOPs", href: "/super-admin/ai-command-center/sops" },
  { label: "Rules", href: "/super-admin/ai-command-center/rules" },
  { label: "Knowledge", href: "/super-admin/ai-command-center/knowledge" },
  { label: "Evaluation", href: "/super-admin/ai-command-center/evaluation" },
  { label: "Governance", href: "/super-admin/ai-command-center/governance" },
  { label: "Security", href: "/super-admin/ai-command-center/security" },
  { label: "Audit Trail", href: "/super-admin/ai-command-center/audit" },
  { label: "Observability", href: "/super-admin/ai-command-center/observability" },
  { label: "Workflows", href: "/super-admin/ai-command-center/workflows" },
  { label: "Certification", href: "/super-admin/ai-command-center/certification" },
];
