"use client";

/**
 * /employee/crm/[entity] — the counsellor's management screen for one entity.
 *
 * The API scopes every query: a counsellor sees their own leads, students and
 * tasks, and records they create are assigned to them. This screen is the UI
 * for that surface; the earlier raw-JSON dashboard links are gone.
 */

import { use } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { CrmManager } from "@/components/site/crm-manager";
import { COUNSELOR_ENTITIES } from "@/components/site/crm-entity-configs";

const NAV = [
  { label: "Dashboard", href: "/employee/dashboard" },
  { label: "Leads", href: "/employee/crm/leads" },
  { label: "Lead priority", href: "/employee/lead-priority" },
  { label: "Pipeline board", href: "/employee/pipeline" },
  { label: "Students", href: "/employee/crm/students" },
  { label: "Applications", href: "/employee/crm/applications" },
  { label: "Tasks", href: "/employee/crm/tasks" },
  { label: "Appointments", href: "/employee/crm/appointments" },
  { label: "Messages", href: "/employee/crm/messages" },
  { label: "Documents", href: "/employee/crm/documents" },
  { label: "Review queue", href: "/employee/review-queue" },
  { label: "Consent register", href: "/employee/consent" },
];

export default function EmployeeCrmEntityPage({ params }: { params: Promise<{ entity: string }> }) {
  const { entity } = use(params);
  const config = COUNSELOR_ENTITIES[entity];

  return (
    <DashboardShell title="Employee Portal" nav={NAV} role="COUNSELOR">
      {config ? (
        <CrmManager config={config} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="text-xl font-bold">Unknown entity</h2>
          <p className="mt-2 text-sm text-slate-600">
            “{entity}” is not an entity this portal manages. Pick one from the navigation.
          </p>
          <Link href="/employee/dashboard" className="mt-4 inline-flex min-h-11 items-center font-medium text-blue-700 underline underline-offset-2">
            Back to the dashboard
          </Link>
        </div>
      )}
    </DashboardShell>
  );
}
