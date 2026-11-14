"use client";

/**
 * /super-admin/ai-command-center
 *
 * The main AI Command Center dashboard. Reads the overview endpoint and
 * surfaces every registry's real metrics: 100 departments, 2000 AI
 * employees, 48 skills, 200 prompts, 100 SOPs, 12 constitutional rules,
 * 10 workflows, 8 models, plus live agent-runtime counters.
 */

import {
  DashboardShell,
  DashboardCard,
  useApi,
} from "@/components/site/dashboard-shell";
import {
  Building2,
  Users,
  Cpu,
  ShieldCheck,
  FileText,
  Workflow,
  Database,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
} from "lucide-react";
import { COMMAND_CENTER_NAV } from "./nav";

type Overview = {
  registry: {
    departments: { total: number; certified: number; conditional: number; failed: number; underReview: number };
    workforce: { total: number; byRole: Record<string, number>; byProvider: Record<string, number> };
    skills: { total: number; categories: Record<string, number> };
    prompts: { total: number; approved: number; draft: number; testing: number };
    sops: { total: number; active: number };
    rules: { total: number; active: number; block: number; warn: number; log: number };
    workflows: { total: number; active: number; testing: number };
    models: { total: number; approved: number; evaluating: number; deprecated: number; rejected: number };
    dcc: {
      averageScore: number;
      averageSkillCoverage: number;
      averageSopCoverage: number;
      averageKnowledgeCoverage: number;
      averageSelfRecovery: number;
      averageHumanEscalation: number;
    };
  };
  live: {
    registeredAgents: number;
    queuedJobs: number;
    runningJobs: number;
    failedJobs: number;
    deadLetterJobs: number;
    pendingApprovals: number;
    todayEvents: number;
    auditLogsToday: number;
  };
  generatedAt: string;
};

function CommandCenterContent() {
  const { data, loading, error } = useApi<Overview>("/api/super-admin/overview");

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
        Loading command center overview...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">Failed to load the command center overview.</p>
        <p className="mt-1 text-sm">
          {error ?? "Unknown error. Ensure you are signed in as a SUPER_ADMIN."}
        </p>
      </div>
    );
  }

  const { registry, live } = data;

  return (
    <div className="space-y-6">
      {/* Top metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Departments"
          value={registry.departments.total}
          desc={`${registry.departments.certified} certified · ${registry.departments.conditional} conditional`}
          icon={Building2}
        />
        <DashboardCard
          title="AI Workforce"
          value={registry.workforce.total}
          desc={`${Object.keys(registry.workforce.byRole).length} role types`}
          icon={Users}
        />
        <DashboardCard
          title="Skills"
          value={registry.skills.total}
          desc={`${Object.keys(registry.skills.categories).length} categories`}
          icon={Cpu}
        />
        <DashboardCard
          title="Constitutional Rules"
          value={registry.rules.total}
          desc={`${registry.rules.block} blocking · ${registry.rules.warn} warn`}
          icon={ShieldCheck}
        />
      </div>

      {/* Second row: live platform telemetry */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Registered Agents (live)"
          value={live.registeredAgents}
          desc="In the agent runtime"
          icon={Cpu}
        />
        <DashboardCard
          title="Queued Jobs"
          value={live.queuedJobs}
          desc="Awaiting a worker"
          icon={Clock}
        />
        <DashboardCard
          title="Running Jobs"
          value={live.runningJobs}
          desc="In progress now"
          icon={Activity}
        />
        <DashboardCard
          title="Pending Approvals"
          value={live.pendingApprovals}
          desc="Waiting on a human"
          icon={AlertTriangle}
        />
      </div>

      {/* Third row: governance & resilience */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Prompts"
          value={registry.prompts.total}
          desc={`${registry.prompts.approved} approved · ${registry.prompts.draft} draft`}
          icon={FileText}
        />
        <DashboardCard
          title="SOPs"
          value={registry.sops.total}
          desc={`${registry.sops.active} active`}
          icon={FileText}
        />
        <DashboardCard
          title="Workflows"
          value={registry.workflows.total}
          desc={`${registry.workflows.active} active · ${registry.workflows.testing} testing`}
          icon={Workflow}
        />
        <DashboardCard
          title="AI Models"
          value={registry.models.total}
          desc={`${registry.models.approved} approved · ${registry.models.evaluating} evaluating`}
          icon={Database}
        />
      </div>

      {/* DCC average */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Average DCC Score"
          value={`${registry.dcc.averageScore}%`}
          desc="Across 100 departments"
          icon={Award}
        />
        <DashboardCard
          title="Avg Skill Coverage"
          value={`${registry.dcc.averageSkillCoverage}%`}
          desc="Employees with declared skills"
          icon={CheckCircle2}
        />
        <DashboardCard
          title="Avg Self-Recovery"
          value={`${registry.dcc.averageSelfRecovery}%`}
          desc={`Human escalation ${registry.dcc.averageHumanEscalation}%`}
          icon={Activity}
        />
      </div>

      {/* Failure surface — only shown when there is something to surface */}
      {(live.failedJobs > 0 || live.deadLetterJobs > 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-700" />
            <h3 className="font-semibold text-amber-900">Failures need triage</h3>
          </div>
          <p className="mt-2 text-sm text-amber-800">
            {live.failedJobs} failed jobs and {live.deadLetterJobs} dead-lettered jobs in the agent queue.
            The constitutional rule <span className="font-mono">Dead-Letter-Triage</span> requires human
            review before any of those agents can run again.
          </p>
        </div>
      )}

      {/* Activity today */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-3 font-semibold">Today&apos;s platform activity</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Agent events (24h)</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{live.todayEvents}</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Audit logs (24h)</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{live.auditLogsToday}</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Workforce by role</p>
            <p className="mt-1 text-xs text-slate-600">
              {Object.entries(registry.workforce.byRole)
                .map(([role, count]) => `${count} ${role}`)
                .join(" · ")}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Workforce by provider</p>
            <p className="mt-1 text-xs text-slate-600">
              {Object.entries(registry.workforce.byProvider)
                .map(([provider, count]) => `${count} ${provider}`)
                .join(" · ")}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Overview generated at {new Date(data.generatedAt).toLocaleString()}.
      </p>
    </div>
  );
}

export default function CommandCenterPage() {
  return (
    <DashboardShell
      title="AI Command Center"
      nav={COMMAND_CENTER_NAV}
      role="SUPER_ADMIN"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Super Admin AI Command Center</h2>
        <p className="mt-1 text-slate-600">
          The platform&apos;s AI workforce at a glance: 100 departments, 2000 AI employees,
          their skills, prompts, SOPs, rules, models and live activity.
        </p>
      </div>
      <CommandCenterContent />
    </DashboardShell>
  );
}
