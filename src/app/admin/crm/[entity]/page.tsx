"use client";

/**
 * /admin/crm/[entity] — the management screen for one CRM entity.
 *
 * Replaces the raw JSON links the admin dashboard used to ship: "Manage
 * users" now opens a real table with search, create, edit and delete, all
 * against the same REST endpoints. Unknown entity slugs render a clear
 * not-found panel instead of an empty screen.
 */

import { use } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { CrmManager } from "@/components/site/crm-manager";
import { ADMIN_ENTITIES } from "@/components/site/crm-entity-configs";

const NAV = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Users", href: "/admin/crm/users" },
  { label: "Universities", href: "/admin/crm/universities" },
  { label: "Courses", href: "/admin/crm/courses" },
  { label: "Scholarships", href: "/admin/crm/scholarships" },
  { label: "Countries", href: "/admin/crm/countries" },
  { label: "Branches", href: "/admin/crm/branches" },
  { label: "Departments", href: "/admin/crm/departments" },
  { label: "Partners", href: "/admin/crm/partners" },
  { label: "Commissions", href: "/admin/crm/commissions" },
  { label: "Audit Logs", href: "/admin/crm/audit-logs" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "SEO audit", href: "/admin/seo" },
  { label: "AI Agents", href: "/admin/agents" },
  { label: "Exam center", href: "/admin/exam-center" },
  { label: "Learning", href: "/admin/learning" },
  { label: "Settings", href: "/admin/settings" },
];

export default function AdminCrmEntityPage({ params }: { params: Promise<{ entity: string }> }) {
  const { entity } = use(params);
  const config = ADMIN_ENTITIES[entity];

  return (
    <DashboardShell title="Admin Portal" nav={NAV} roles={["ADMIN", "SUPER_ADMIN"]}>
      {config ? (
        <CrmManager config={config} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="text-xl font-bold">Unknown entity</h2>
          <p className="mt-2 text-sm text-slate-600">
            “{entity}” is not an entity this portal manages. Pick one from the navigation.
          </p>
          <Link href="/admin/dashboard" className="mt-4 inline-flex min-h-11 items-center font-medium text-blue-700 underline underline-offset-2">
            Back to the dashboard
          </Link>
        </div>
      )}
    </DashboardShell>
  );
}
