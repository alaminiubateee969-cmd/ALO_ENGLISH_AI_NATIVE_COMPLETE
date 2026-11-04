"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, Archive, ArrowLeft, ArrowRight, Boxes, Building2, Check, ChevronRight,
  CircleGauge, CloudCog, Code2, DatabaseBackup, Factory, FileClock, GitBranch,
  HeartPulse, Layers3, Library, Loader2, LockKeyhole, Network, Plus, RefreshCw,
  Rocket, ShieldCheck, Sparkles, X,
} from "lucide-react";

type AnyRecord = Record<string, any>;
type Overview = {
  summary: AnyRecord;
  companies: AnyRecord[];
  templates: AnyRecord[];
  modules: AnyRecord[];
  applications: AnyRecord[];
  runs: AnyRecord[];
  deployments: AnyRecord[];
  releases: AnyRecord[];
  approvals: AnyRecord[];
  backups: AnyRecord[];
  changes: AnyRecord[];
  auditEvents: AnyRecord[];
  integrations: AnyRecord[];
};

const NAV = [
  ["overview", "Command overview", CircleGauge],
  ["companies", "Company Registry", Building2],
  ["templates", "Template Library", Library],
  ["modules", "Module Library", Boxes],
  ["factory", "Application Factory", Factory],
  ["queue", "Provisioning Queue", FileClock],
  ["deployments", "Deployment Center", Rocket],
  ["releases", "Release Management", GitBranch],
  ["integrations", "Integration Hub", Network],
  ["monitoring", "Monitoring & Alerts", HeartPulse],
  ["backups", "Backup & Recovery", DatabaseBackup],
  ["engineering", "Engineering Workspace", Code2],
  ["audit", "Security & Audit", ShieldCheck],
] as const;

const EMPTY: Overview = { summary: {}, companies: [], templates: [], modules: [], applications: [], runs: [], deployments: [], releases: [], approvals: [], backups: [], changes: [], auditEvents: [], integrations: [] };
const input = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500";
const primary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50";
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

function Status({ value }: { value: string }) {
  const color = /LIVE|READY|PASS|VERIFIED|DEPLOYED|APPROVED|HEALTHY/.test(value) ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : /FAIL|BLOCKED|DEGRADED|ERROR/.test(value) ? "bg-rose-50 text-rose-700 ring-rose-200"
      : /STAGING|PROVISION|AWAITING|SUPERSEDED|ROLLED/.test(value) ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-slate-100 text-slate-600 ring-slate-200";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${color}`}>{value.replaceAll("_", " ")}</span>;
}

function Modal({ title, subtitle, children, onClose, wide = false }: { title: string; subtitle: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
    <div className={`max-h-[94vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${wide ? "max-w-5xl" : "max-w-2xl"}`}>
      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
        <div><h2 className="text-xl font-bold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800" aria-label="Close"><X className="size-5" /></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>;
}

function Empty({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center"><Layers3 className="mx-auto size-8 text-slate-300" /><h3 className="mt-3 font-semibold text-slate-800">{title}</h3><p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">{detail}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">{headers.map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{children}</tbody></table></div>;
}

export function SoftwareFactoryControlCenter() {
  const [data, setData] = useState<Overview>(EMPTY);
  const [tab, setTab] = useState<string>("overview");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<"company" | "template" | "module" | "change" | "contacts" | null>(null);
  const [contactCompany, setContactCompany] = useState<AnyRecord | null>(null);
  const [contacts, setContacts] = useState<AnyRecord[]>([]);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [step, setStep] = useState(1);
  const [companyForm, setCompanyForm] = useState<AnyRecord>({ companyName: "", slug: "", relationship: "SISTER", industry: "Technology", applicationName: "", templateVersionId: "", deploymentModel: "SHARED_TENANT", domain: "", enabledModuleVersionIds: [], departments: [], integrations: [], retentionDays: 365, backupRetentionDays: 90, initialAdminUserId: "", branding: { primaryColor: "#123B5D", accentColor: "#19A974", logoUrl: "", navigation: ["Dashboard", "Contacts"] } });
  const [templateForm, setTemplateForm] = useState<AnyRecord>({ slug: "", name: "", category: "Company-in-a-Box", description: "", version: "1.0.0", configurationSchema: {}, navigation: [], workflows: [], acceptanceTests: ["Provision two isolated applications and verify independent configuration"], releaseNotes: "Initial private template release", moduleVersionIds: [], approve: true });
  const [moduleForm, setModuleForm] = useState<AnyRecord>({ slug: "", name: "", category: "CRM", description: "", version: "1.0.0", capabilities: ["Company-scoped contact records"], dependencies: [], compatibility: "Factory schema v1", acceptanceTests: ["Deny cross-company reads and writes"], releaseNotes: "Initial reusable module", });
  const [changeForm, setChangeForm] = useState<AnyRecord>({ kind: "FEATURE", title: "", description: "", disposition: "UNDECIDED", templateId: "" });

  const load = useCallback(async () => {
    setError("");
    const me = await fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json());
    if (!me.success || !["ADMIN", "SUPER_ADMIN"].includes(me.data.user.role)) {
      setError("Software Factory access requires an ADMIN or SUPER_ADMIN session.");
      setLoading(false);
      return;
    }
    const response = await fetch("/api/factory/overview", { cache: "no-store" }).then((r) => r.json());
    if (!response.success) setError(response.message || "Factory data could not be loaded");
    else setData({ ...EMPTY, ...response.data });
    setLoading(false);
  }, []);

  // Initial data is fetched from the persisted factory API, not client-only demo state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function action(key: string, url: string, body?: unknown, method = "POST") {
    setBusy(key); setError(""); setNotice("");
    try {
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) }).then((r) => r.json());
      if (!response.success) throw new Error(response.message || "Operation failed");
      setNotice(response.message || "Operation completed");
      await load();
      return response.data;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Operation failed");
      return null;
    } finally { setBusy(""); }
  }

  const approvedVersions = useMemo(() => data.templates.flatMap((template) => template.versions.filter((version: AnyRecord) => version.status === "APPROVED").map((version: AnyRecord) => ({ ...version, templateName: template.name }))), [data.templates]);
  const moduleVersions = useMemo(() => data.modules.flatMap((module) => module.versions.map((version: AnyRecord) => ({ ...version, moduleName: module.name }))), [data.modules]);
  const selectedTemplate = approvedVersions.find((version) => version.id === companyForm.templateVersionId);

  function openCompanyWizard() {
    const first = approvedVersions[0];
    setCompanyForm((current) => ({ ...current, templateVersionId: first?.id ?? "", enabledModuleVersionIds: first?.moduleLinks?.map((link: AnyRecord) => link.moduleVersionId) ?? [] }));
    setStep(1); setModal("company");
  }

  async function submitCompany() {
    const payload = { ...companyForm, retentionDays: Number(companyForm.retentionDays), backupRetentionDays: Number(companyForm.backupRetentionDays), departments: String(companyForm.departments).split(",").map((v: string) => v.trim()).filter(Boolean), initialAdminUserId: companyForm.initialAdminUserId || null };
    const result = await action("create-company", "/api/factory/companies", payload);
    if (result) { setModal(null); setTab("factory"); }
  }

  async function submitTemplate() {
    const result = await action("create-template", "/api/factory/templates", templateForm);
    if (result) setModal(null);
  }

  async function submitModule() {
    const result = await action("create-module", "/api/factory/modules", moduleForm);
    if (result) setModal(null);
  }

  async function submitChange() {
    const result = await action("create-change", "/api/factory/changes", { ...changeForm, templateId: changeForm.templateId || null });
    if (result) { setModal(null); setChangeForm({ kind: "FEATURE", title: "", description: "", disposition: "UNDECIDED", templateId: "" }); }
  }

  async function openContacts(company: AnyRecord) {
    setContactCompany(company); setContacts([]); setModal("contacts"); setError(""); setBusy("contacts");
    try {
      const response = await fetch("/api/factory/tenant/contacts", { headers: { "x-factory-company-id": company.id }, cache: "no-store" }).then((r) => r.json());
      if (!response.success) throw new Error(response.message || "Explicit company membership is required");
      setContacts(response.data.contacts);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Contacts could not be loaded");
    } finally { setBusy(""); }
  }

  async function submitContact() {
    if (!contactCompany) return;
    const result = await action("create-contact", "/api/factory/tenant/contacts", { ...contactForm, companyId: contactCompany.id });
    if (result) {
      setContacts((current) => [result.contact, ...current]);
      setContactForm({ name: "", email: "", phone: "", notes: "" });
    }
  }

  function applicationActions(app: AnyRecord) {
    return <div className="flex flex-wrap gap-2">
      {["DRAFT", "TEST_FAILED"].includes(app.status) && <button className={secondary} disabled={Boolean(busy)} onClick={() => void action(`validate-${app.id}`, `/api/factory/applications/${app.id}/validate`)}>Validate</button>}
      {app.status === "VALIDATED" && <button className={primary} disabled={Boolean(busy)} onClick={() => void action(`provision-${app.id}`, `/api/factory/applications/${app.id}/provision`)}>Provision</button>}
      {["STAGING", "AWAITING_APPROVAL"].includes(app.status) && <button className={primary} disabled={Boolean(busy)} onClick={() => { const note = window.prompt("Approval note"); if (note) void action(`activate-${app.id}`, `/api/factory/applications/${app.id}/activate`, { note }); }}>Approve activation</button>}
      {["LIVE", "DEGRADED", "ROLLED_BACK"].includes(app.status) && <button className={secondary} disabled={Boolean(busy)} onClick={() => { const next = approvedVersions.find((version) => version.id !== app.templateVersionId); if (next) { const impactAssessment = window.prompt(`Impact assessment for v${next.version}`); const rollbackPlan = impactAssessment ? window.prompt("Specific known-good rollback plan") : null; if (impactAssessment && rollbackPlan) void action(`release-${app.id}`, `/api/factory/applications/${app.id}/releases`, { templateVersionId: next.id, impactAssessment, rollbackPlan }); } else setError("Create and approve another template version before staging an upgrade."); }}>Stage update</button>}
    </div>;
  }

  function renderOverview() {
    const cards = [
      ["Companies", data.summary.companies ?? 0, Building2], ["Applications", data.summary.applications ?? 0, CloudCog],
      ["Live", data.summary.live ?? 0, Rocket], ["Private templates", data.summary.templates ?? 0, Library],
      ["Reusable modules", data.summary.modules ?? 0, Boxes], ["Verified backups", data.summary.verifiedBackups ?? 0, Archive],
    ];
    return <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#102b3f] via-[#123b50] to-[#0d5954] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div className="max-w-2xl"><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-teal-100 ring-1 ring-white/15"><Sparkles className="size-3.5" /> Build once. Configure. Reuse.</div><h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Your private software manufacturing system.</h2><p className="mt-3 text-sm leading-6 text-slate-200">Compose approved modules into company applications with explicit isolation, versioned configuration and controlled releases. No mandatory external builder control plane.</p></div><button onClick={openCompanyWizard} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#123b50] shadow-sm transition hover:bg-teal-50"><Plus className="size-5" /> Create New Company</button></div>
      </section>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{cards.map(([name, value, Icon]) => { const I = Icon as typeof Building2; return <div key={name as string} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><I className="size-5 text-teal-600" /><p className="mt-3 text-2xl font-bold text-slate-950">{value as number}</p><p className="mt-1 text-xs font-medium text-slate-500">{name as string}</p></div>; })}</div>
      <section><div className="mb-3 flex items-center justify-between"><div><h3 className="font-bold text-slate-900">Application lifecycle</h3><p className="text-sm text-slate-500">Statuses below are loaded from factory records.</p></div><button className={secondary} onClick={() => setTab("factory")}>Open factory <ChevronRight className="size-4" /></button></div>{renderApplications(data.applications.slice(0, 5))}</section>
    </div>;
  }

  function renderApplications(apps: AnyRecord[]) {
    if (!apps.length) return <Empty title="No applications yet" detail="Create a company from an approved template. Drafts do not become live without validation, provisioning and human approval." action={<button className={primary} onClick={openCompanyWizard}><Plus className="size-4" /> Create company</button>} />;
    return <Table headers={["Company / application", "Template", "Model", "Health", "Status", "Actions"]}>{apps.map((app) => <tr key={app.id}><td className="px-4 py-4"><p className="font-semibold text-slate-900">{app.name}</p><p className="mt-0.5 text-xs text-slate-500">{app.company.legalName}</p></td><td className="px-4 py-4"><p>{app.templateVersion.template.name}</p><p className="text-xs text-slate-500">v{app.templateVersion.version}</p></td><td className="px-4 py-4 text-xs">{app.deploymentModel.replaceAll("_", " ")}</td><td className="px-4 py-4"><Status value={app.healthStatus} /></td><td className="px-4 py-4"><Status value={app.status} /></td><td className="px-4 py-4">{applicationActions(app)}</td></tr>)}</Table>;
  }

  function renderSimple() {
    if (tab === "companies") return data.companies.length ? <Table headers={["Company", "Relationship", "Industry", "Applications", "Members", "Status", "Customer administration"]}>{data.companies.map((company) => <tr key={company.id}><td className="px-4 py-4"><p className="font-semibold">{company.legalName}</p><p className="text-xs text-slate-500">{company.slug}</p></td><td className="px-4 py-4">{company.relationship}</td><td className="px-4 py-4">{company.industry}</td><td className="px-4 py-4">{company._count.applications}</td><td className="px-4 py-4">{company._count.memberships}</td><td className="px-4 py-4"><Status value={company.status} /></td><td className="px-4 py-4"><button className={secondary} onClick={() => void openContacts(company)}>Contacts</button></td></tr>)}</Table> : <Empty title="Company registry is empty" detail="Company definitions are created through the guided factory workflow." />;
    if (tab === "templates") return <div className="space-y-4"><div className="flex justify-end"><button className={primary} onClick={() => setModal("template")}><Plus className="size-4" /> New private template</button></div>{data.templates.length ? <div className="grid gap-4 lg:grid-cols-2">{data.templates.map((template) => <article key={template.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-teal-600">{template.category}</p><h3 className="mt-1 text-lg font-bold">{template.name}</h3></div><Status value={template.status} /></div><p className="mt-3 text-sm leading-6 text-slate-600">{template.description}</p><div className="mt-4 space-y-2">{template.versions.map((version: AnyRecord) => <div key={version.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><span className="font-mono font-semibold">v{version.version}</span><span className="text-xs text-slate-500">{version.moduleLinks.length} modules</span><Status value={version.status} /></div>)}</div></article>)}</div> : <Empty title="No private templates" detail="Create a template with real acceptance criteria and approved module versions. No screenshot-only catalogue entries." action={<button className={primary} onClick={() => setModal("template")}>Create template</button>} />}</div>;
    if (tab === "modules") return <div className="space-y-4"><div className="flex justify-end"><button className={primary} onClick={() => setModal("module")}><Plus className="size-4" /> New reusable module</button></div>{data.modules.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.modules.map((moduleDefinition) => <article key={moduleDefinition.id} className="rounded-xl border border-slate-200 bg-white p-5"><Boxes className="size-6 text-teal-600" /><p className="mt-3 text-xs font-semibold uppercase text-slate-400">{moduleDefinition.category}</p><h3 className="mt-1 font-bold">{moduleDefinition.name}</h3><p className="mt-2 text-sm text-slate-600">{moduleDefinition.description}</p><div className="mt-4 flex flex-wrap gap-2">{moduleDefinition.versions.map((version: AnyRecord) => <span key={version.id} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs">v{version.version}</span>)}</div></article>)}</div> : <Empty title="No reusable modules" detail="Start with an independently selectable capability and its own tests, compatibility and release notes." />}</div>;
    if (tab === "factory") return <div className="space-y-4"><div className="flex items-center justify-between"><div><h3 className="font-bold">Application Factory</h3><p className="text-sm text-slate-500">Select → Configure → Validate → Provision → Test → Approve.</p></div><button className={primary} onClick={openCompanyWizard}><Plus className="size-4" /> New company</button></div>{renderApplications(data.applications)}</div>;
    if (tab === "queue") return data.runs.length ? <Table headers={["Run", "Application", "Status", "Started", "Detail"]}>{data.runs.map((run) => <tr key={run.id}><td className="px-4 py-4 font-mono text-xs">{run.id.slice(0, 10)}</td><td className="px-4 py-4">{data.applications.find((app) => app.id === run.applicationId)?.name ?? run.applicationId}</td><td className="px-4 py-4"><Status value={run.status} /></td><td className="px-4 py-4">{new Date(run.startedAt).toLocaleString()}</td><td className="max-w-md px-4 py-4 text-xs text-slate-500">{run.error || "Real control-plane checks recorded"}</td></tr>)}</Table> : <Empty title="No provisioning runs" detail="Validation and provisioning runs will appear here with their persisted results." />;
    if (tab === "deployments") return data.deployments.length ? <Table headers={["Application", "Environment", "Adapter", "Status", "Details"]}>{data.deployments.map((deployment) => <tr key={deployment.id}><td className="px-4 py-4">{data.applications.find((app) => app.id === deployment.applicationId)?.name}</td><td className="px-4 py-4">{deployment.environment}</td><td className="px-4 py-4 font-mono text-xs">{deployment.adapter}</td><td className="px-4 py-4"><Status value={deployment.status} /></td><td className="max-w-md px-4 py-4 text-xs text-slate-500">{deployment.details}</td></tr>)}</Table> : <Empty title="No deployment records" detail="Shared staging is created by provisioning. Dedicated infrastructure remains blocked until a real adapter is configured." />;
    if (tab === "releases") return <div className="space-y-4">{data.releases.length ? <Table headers={["Application", "Version", "Status", "Impact assessment", "Rollback plan", "Created", "Rollback"]}>{data.releases.map((release) => { const app = data.applications.find((item) => item.id === release.applicationId); if (!app) return null; return <tr key={release.id}><td className="px-4 py-4">{app?.name}</td><td className="px-4 py-4 font-mono">v{release.version}</td><td className="px-4 py-4"><Status value={release.status} /></td><td className="max-w-sm px-4 py-4 text-xs text-slate-600">{release.impactAssessment}</td><td className="max-w-sm px-4 py-4 text-xs text-slate-600">{release.rollbackPlan}</td><td className="px-4 py-4">{new Date(release.createdAt).toLocaleString()}</td><td className="px-4 py-4">{release.status === "ACTIVE" && data.releases.some((item) => item.applicationId === release.applicationId && item.status === "SUPERSEDED") ? <button className={secondary} onClick={() => { const note = window.prompt("Rollback approval note"); if (note) void action(`rollback-${app.id}`, `/api/factory/applications/${app.id}/rollback`, { note }); }}>Restore known-good</button> : "—"}</td></tr>; })}</Table> : <Empty title="No releases" detail="Provisioning creates a staging release. Activation and rollback preserve release history." />}</div>;
    if (tab === "integrations") return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.integrations.map((integration) => <article key={integration.id} className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><Network className="size-5 text-teal-600" /><Status value={integration.configured ? "CONFIGURED" : "DISABLED"} /></div><h3 className="mt-3 font-bold">{integration.name}</h3><p className="mt-1 text-xs uppercase text-slate-400">{integration.category}</p><p className="mt-3 text-sm leading-6 text-slate-600">{integration.degrades}</p>{integration.missingKeys.length > 0 && <p className="mt-3 text-xs text-slate-400">Missing environment keys: {integration.missingKeys.join(", ")}</p>}</article>)}</div>;
    if (tab === "monitoring") return <Table headers={["Application", "Health", "Lifecycle", "Last control-plane check", "Model"]}>{data.applications.map((app) => <tr key={app.id}><td className="px-4 py-4 font-semibold">{app.name}</td><td className="px-4 py-4"><Status value={app.healthStatus} /></td><td className="px-4 py-4"><Status value={app.status} /></td><td className="px-4 py-4">{app.lastHealthCheckAt ? new Date(app.lastHealthCheckAt).toLocaleString() : "Not checked"}</td><td className="px-4 py-4">{app.deploymentModel}</td></tr>)}</Table>;
    if (tab === "backups") return <div className="space-y-4"><div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><LockKeyhole className="mr-2 inline size-4" />Backup writes a control-plane-only SQLite image and portable definition with restricted permissions. It excludes ALO and tenant business records. Restoration requires an isolated reviewed import; the UI never overwrites a live database.</div>{data.applications.length > 0 && <div className="flex flex-wrap gap-2">{data.applications.map((app) => <button key={app.id} className={secondary} disabled={Boolean(busy)} onClick={() => void action(`backup-${app.id}`, `/api/factory/applications/${app.id}/backup`)}><DatabaseBackup className="size-4" /> Back up {app.name}</button>)}</div>}{data.backups.length ? <Table headers={["Application", "Status", "Integrity", "Size", "SHA-256", "Created"]}>{data.backups.map((backup) => <tr key={backup.id}><td className="px-4 py-4">{data.applications.find((app) => app.id === backup.applicationId)?.name}</td><td className="px-4 py-4"><Status value={backup.status} /></td><td className="px-4 py-4">{backup.integrity}</td><td className="px-4 py-4">{backup.byteSize.toLocaleString()} B</td><td className="max-w-[180px] truncate px-4 py-4 font-mono text-xs">{backup.sha256}</td><td className="px-4 py-4">{new Date(backup.createdAt).toLocaleString()}</td></tr>)}</Table> : <Empty title="No verified factory backups" detail="A record appears only after the backup image opens and passes integrity and application-definition checks." />}</div>;
    if (tab === "engineering") return <div className="space-y-4"><div className="flex justify-end"><button className={primary} onClick={() => setModal("change")}><Plus className="size-4" /> Record change</button></div>{data.changes.length ? <Table headers={["Type", "Title", "Disposition", "Status", "Requested"]}>{data.changes.map((change) => <tr key={change.id}><td className="px-4 py-4">{change.kind}</td><td className="px-4 py-4"><p className="font-semibold">{change.title}</p><p className="max-w-lg truncate text-xs text-slate-500">{change.description}</p></td><td className="px-4 py-4">{change.disposition.replaceAll("_", " ")}</td><td className="px-4 py-4"><Status value={change.status} /></td><td className="px-4 py-4">{new Date(change.createdAt).toLocaleDateString()}</td></tr>)}</Table> : <Empty title="No engineering changes" detail="Record bugs, reusable fixes, security findings and client customizations with an explicit disposition." />}</div>;
    if (tab === "audit") return data.auditEvents.length ? <Table headers={["Time", "Actor", "Action", "Resource", "Company"]}>{data.auditEvents.map((event) => <tr key={event.id}><td className="px-4 py-4">{new Date(event.createdAt).toLocaleString()}</td><td className="px-4 py-4 font-mono text-xs">{event.actorUserId.slice(0, 10)}</td><td className="px-4 py-4 font-semibold">{event.action}</td><td className="px-4 py-4 font-mono text-xs">{event.resource.slice(0, 14)}</td><td className="px-4 py-4 font-mono text-xs">{event.companyId?.slice(0, 10) ?? "Factory"}</td></tr>)}</Table> : <Empty title="No factory audit events" detail="Privileged creation, validation, provisioning, approval, backup and tenant changes are recorded here." />;
    return null;
  }

  return <div className="min-h-screen bg-[#f3f6f8] text-slate-900">
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col bg-[#0d2333] text-white lg:flex"><div className="flex h-20 items-center gap-3 border-b border-white/10 px-5"><div className="flex size-10 items-center justify-center rounded-xl bg-teal-500 text-[#0d2333]"><Factory className="size-6" /></div><div><p className="font-black tracking-tight">BDTECH360</p><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300">Software Factory</p></div></div><nav className="flex-1 space-y-1 overflow-y-auto p-3">{NAV.map(([id, name, Icon]) => <button key={id} onClick={() => setTab(id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${tab === id ? "bg-teal-500/15 text-teal-300 ring-1 ring-teal-400/20" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}><Icon className="size-4 shrink-0" />{name}</button>)}</nav><div className="m-3 rounded-xl bg-white/5 p-3 text-xs leading-5 text-slate-300"><ShieldCheck className="mb-2 size-4 text-teal-300" />Factory access does not imply customer-data access.</div></aside>
      <main className="min-w-0 flex-1"><header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Private Company & Software Factory</p><h1 className="mt-0.5 text-lg font-bold capitalize sm:text-xl">{NAV.find(([id]) => id === tab)?.[1]}</h1></div><div className="flex items-center gap-2"><select aria-label="Factory section" className={`${input} max-w-[180px] lg:hidden`} value={tab} onChange={(event) => setTab(event.target.value)}>{NAV.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><button className={secondary} onClick={() => { setLoading(true); void load(); }} aria-label="Refresh factory data"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /><span className="hidden sm:inline">Refresh</span></button></div></div></header>
        <div className="p-4 sm:p-6 lg:p-8">{error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</div>}{notice && <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><Check className="size-4" />{notice}</div>}{busy && <div className="mb-4 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" />Executing {busy.replaceAll("-", " ")}…</div>}{loading ? <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="size-8 animate-spin text-teal-600" /></div> : tab === "overview" ? renderOverview() : renderSimple()}</div>
      </main>
    </div>

    {modal === "company" && <Modal wide title="Create New Company" subtitle="A reusable, version-controlled definition. No live customer data is copied." onClose={() => setModal(null)}>
      <div className="mb-6 flex items-center gap-2">{[1, 2, 3, 4, 5].map((number) => <div key={number} className={`h-1.5 flex-1 rounded-full ${step >= number ? "bg-teal-500" : "bg-slate-200"}`} />)}</div>
      {step === 1 && <div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label className={label}>Legal company name</label><input className={input} value={companyForm.companyName} onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value, applicationName: companyForm.applicationName || `${e.target.value} Workspace`, slug: companyForm.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })} placeholder="Example Sister Company Ltd." /></div><div><label className={label}>Unique slug</label><input className={input} value={companyForm.slug} onChange={(e) => setCompanyForm({ ...companyForm, slug: e.target.value })} /></div><div><label className={label}>Relationship</label><select className={input} value={companyForm.relationship} onChange={(e) => setCompanyForm({ ...companyForm, relationship: e.target.value })}><option>PARENT</option><option>SISTER</option><option>CLIENT</option><option>INTERNAL</option></select></div><div><label className={label}>Industry</label><input className={input} value={companyForm.industry} onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })} /></div><div><label className={label}>Application name</label><input className={input} value={companyForm.applicationName} onChange={(e) => setCompanyForm({ ...companyForm, applicationName: e.target.value })} /></div><div className="sm:col-span-2"><label className={label}>Explicit initial company administrator user ID (optional)</label><input className={input} value={companyForm.initialAdminUserId} onChange={(e) => setCompanyForm({ ...companyForm, initialAdminUserId: e.target.value })} placeholder="Existing active User ID; factory operator is not added automatically" /></div></div>}
      {step === 2 && <div><label className={label}>Approved application template</label>{approvedVersions.length ? <div className="grid gap-3 sm:grid-cols-2">{approvedVersions.map((version) => <button key={version.id} onClick={() => setCompanyForm({ ...companyForm, templateVersionId: version.id, enabledModuleVersionIds: version.moduleLinks.map((link: AnyRecord) => link.moduleVersionId) })} className={`rounded-xl border p-4 text-left ${companyForm.templateVersionId === version.id ? "border-teal-500 bg-teal-50 ring-2 ring-teal-100" : "border-slate-200 hover:border-slate-300"}`}><p className="font-bold">{version.templateName}</p><p className="mt-1 text-sm text-slate-500">Version {version.version} · {version.moduleLinks.length} modules</p></button>)}</div> : <Empty title="An approved template is required" detail="Close this wizard and create an approved private template first." />}</div>}
      {step === 3 && <div><h3 className="font-semibold">Select independent modules</h3><p className="mt-1 text-sm text-slate-500">Required and optional module versions come from the selected template.</p><div className="mt-4 space-y-2">{selectedTemplate?.moduleLinks?.map((link: AnyRecord) => { const selectedModule = moduleVersions.find((version) => version.id === link.moduleVersionId); return <label key={link.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"><input type="checkbox" checked={companyForm.enabledModuleVersionIds.includes(link.moduleVersionId)} onChange={(e) => setCompanyForm({ ...companyForm, enabledModuleVersionIds: e.target.checked ? [...companyForm.enabledModuleVersionIds, link.moduleVersionId] : companyForm.enabledModuleVersionIds.filter((id: string) => id !== link.moduleVersionId) })} /><span className="flex-1"><span className="block font-semibold">{selectedModule?.moduleName ?? link.moduleVersionId}</span><span className="text-xs text-slate-500">v{selectedModule?.version}</span></span>{link.required && <Status value="REQUIRED" />}</label>; })}</div><div className="mt-4"><label className={label}>Departments (comma separated)</label><input className={input} value={String(companyForm.departments)} onChange={(e) => setCompanyForm({ ...companyForm, departments: e.target.value })} placeholder="Sales, Support, Operations" /></div></div>}
      {step === 4 && <div className="grid gap-4 sm:grid-cols-2"><div><label className={label}>Deployment model</label><select className={input} value={companyForm.deploymentModel} onChange={(e) => setCompanyForm({ ...companyForm, deploymentModel: e.target.value })}><option value="SHARED_TENANT">Shared platform · isolated tenant</option><option value="DEDICATED">Dedicated application · adapter required</option></select></div><div><label className={label}>Hostname {companyForm.deploymentModel === "DEDICATED" && "(required)"}</label><input className={input} value={companyForm.domain} onChange={(e) => setCompanyForm({ ...companyForm, domain: e.target.value })} placeholder="company.example.com" /></div><div><label className={label}>Data retention (days)</label><input type="number" className={input} value={companyForm.retentionDays} onChange={(e) => setCompanyForm({ ...companyForm, retentionDays: e.target.value })} /></div><div><label className={label}>Backup retention (days)</label><input type="number" className={input} value={companyForm.backupRetentionDays} onChange={(e) => setCompanyForm({ ...companyForm, backupRetentionDays: e.target.value })} /></div><div><label className={label}>Primary color</label><input type="color" className="h-11 w-full rounded-lg border border-slate-200" value={companyForm.branding.primaryColor} onChange={(e) => setCompanyForm({ ...companyForm, branding: { ...companyForm.branding, primaryColor: e.target.value } })} /></div><div><label className={label}>Accent color</label><input type="color" className="h-11 w-full rounded-lg border border-slate-200" value={companyForm.branding.accentColor} onChange={(e) => setCompanyForm({ ...companyForm, branding: { ...companyForm.branding, accentColor: e.target.value } })} /></div>{companyForm.deploymentModel === "DEDICATED" && <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 sm:col-span-2">Dedicated provisioning will stop at BLOCKED until a real host deployment adapter is configured. It will not be marked deployed.</div>}</div>}
      {step === 5 && <div className="rounded-xl bg-slate-50 p-5"><h3 className="font-bold">Review company definition</h3><dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Company</dt><dd className="font-semibold">{companyForm.companyName}</dd></div><div><dt className="text-slate-500">Template</dt><dd className="font-semibold">{selectedTemplate?.templateName} v{selectedTemplate?.version}</dd></div><div><dt className="text-slate-500">Deployment</dt><dd>{companyForm.deploymentModel.replaceAll("_", " ")}</dd></div><div><dt className="text-slate-500">Modules</dt><dd>{companyForm.enabledModuleVersionIds.length} selected</dd></div><div><dt className="text-slate-500">Retention</dt><dd>{companyForm.retentionDays} days</dd></div><div><dt className="text-slate-500">Backup</dt><dd>{companyForm.backupRetentionDays} days</dd></div></dl><p className="mt-5 text-xs leading-5 text-slate-500">Creating this record produces a DRAFT only. Validation, provisioning and human activation are separate audited operations.</p></div>}
      <div className="mt-6 flex justify-between"><button className={secondary} disabled={step === 1} onClick={() => setStep(step - 1)}><ArrowLeft className="size-4" /> Back</button>{step < 5 ? <button className={primary} disabled={(step === 1 && (!companyForm.companyName || !companyForm.slug || !companyForm.applicationName)) || (step === 2 && !companyForm.templateVersionId)} onClick={() => setStep(step + 1)}>Continue <ArrowRight className="size-4" /></button> : <button className={primary} disabled={Boolean(busy)} onClick={() => void submitCompany()}><Building2 className="size-4" /> Create DRAFT company</button>}</div>
    </Modal>}

    {modal === "template" && <Modal title="New private template" subtitle="Versioned implementation contract with modules and acceptance criteria." onClose={() => setModal(null)}><div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div><label className={label}>Name</label><input className={input} value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value, slug: templateForm.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })} /></div><div><label className={label}>Slug</label><input className={input} value={templateForm.slug} onChange={(e) => setTemplateForm({ ...templateForm, slug: e.target.value })} /></div><div><label className={label}>Category</label><input className={input} value={templateForm.category} onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })} /></div><div><label className={label}>Version</label><input className={input} value={templateForm.version} onChange={(e) => setTemplateForm({ ...templateForm, version: e.target.value })} /></div></div><div><label className={label}>Description and implemented scope</label><textarea className={input} rows={4} value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} /></div><div><label className={label}>Approved module versions</label><div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">{moduleVersions.map((version) => <label key={version.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={templateForm.moduleVersionIds.includes(version.id)} onChange={(e) => setTemplateForm({ ...templateForm, moduleVersionIds: e.target.checked ? [...templateForm.moduleVersionIds, version.id] : templateForm.moduleVersionIds.filter((id: string) => id !== version.id) })} />{version.moduleName} v{version.version}</label>)}</div></div><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={templateForm.approve} onChange={(e) => setTemplateForm({ ...templateForm, approve: e.target.checked })} />Approve this version for provisioning</label><button className={primary} disabled={Boolean(busy)} onClick={() => void submitTemplate()}>Create template version</button></div></Modal>}

    {modal === "module" && <Modal title="New reusable module" subtitle="Independently selectable capability with compatibility and tests." onClose={() => setModal(null)}><div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div><label className={label}>Name</label><input className={input} value={moduleForm.name} onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value, slug: moduleForm.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })} /></div><div><label className={label}>Slug</label><input className={input} value={moduleForm.slug} onChange={(e) => setModuleForm({ ...moduleForm, slug: e.target.value })} /></div><div><label className={label}>Category</label><input className={input} value={moduleForm.category} onChange={(e) => setModuleForm({ ...moduleForm, category: e.target.value })} /></div><div><label className={label}>Version</label><input className={input} value={moduleForm.version} onChange={(e) => setModuleForm({ ...moduleForm, version: e.target.value })} /></div></div><div><label className={label}>Real implemented scope</label><textarea className={input} rows={4} value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} /></div><button className={primary} disabled={Boolean(busy)} onClick={() => void submitModule()}>Create module version</button></div></Modal>}

    {modal === "contacts" && contactCompany && <Modal wide title={`${contactCompany.legalName} contacts`} subtitle="Customer records require explicit active company membership. Factory ADMIN/SUPER_ADMIN roles alone are denied." onClose={() => setModal(null)}>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>{contacts.length ? <Table headers={["Name", "Email", "Phone", "Created"]}>{contacts.map((contact) => <tr key={contact.id}><td className="px-4 py-3 font-semibold">{contact.name}</td><td className="px-4 py-3">{contact.email || "—"}</td><td className="px-4 py-3">{contact.phone || "—"}</td><td className="px-4 py-3">{new Date(contact.createdAt).toLocaleString()}</td></tr>)}</Table> : <Empty title="No visible contacts" detail="Either this company has no contacts or access was denied. An access denial is shown above and never falls back to global administrator data." />}</div>
        <div className="rounded-xl border border-slate-200 p-4"><h3 className="font-bold">Add company contact</h3><p className="mt-1 text-xs text-slate-500">COMPANY_ADMIN or OPERATOR membership required.</p><div className="mt-4 space-y-3"><input aria-label="Contact name" className={input} placeholder="Name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} /><input aria-label="Contact email" className={input} placeholder="Email (optional)" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} /><input aria-label="Contact phone" className={input} placeholder="Phone (optional)" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} /><textarea aria-label="Contact notes" className={input} placeholder="Notes (optional)" value={contactForm.notes} onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })} /><button className={primary} disabled={Boolean(busy) || !contactForm.name.trim()} onClick={() => void submitContact()}>Create scoped contact</button></div></div>
      </div>
    </Modal>}

    {modal === "change" && <Modal title="Engineering change request" subtitle="Classify shared, reusable, configuration-only and client-specific work." onClose={() => setModal(null)}><div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div><label className={label}>Kind</label><select className={input} value={changeForm.kind} onChange={(e) => setChangeForm({ ...changeForm, kind: e.target.value })}><option>BUG</option><option>FEATURE</option><option>SECURITY</option><option>CUSTOMIZATION</option></select></div><div><label className={label}>Disposition</label><select className={input} value={changeForm.disposition} onChange={(e) => setChangeForm({ ...changeForm, disposition: e.target.value })}><option>UNDECIDED</option><option>SHARED_CORE</option><option>REUSABLE_MODULE</option><option>CONFIGURATION</option><option>CLIENT_EXTENSION</option></select></div></div><div><label className={label}>Title</label><input className={input} value={changeForm.title} onChange={(e) => setChangeForm({ ...changeForm, title: e.target.value })} /></div><div><label className={label}>Evidence and required outcome</label><textarea className={input} rows={5} value={changeForm.description} onChange={(e) => setChangeForm({ ...changeForm, description: e.target.value })} /></div><button className={primary} disabled={Boolean(busy)} onClick={() => void submitChange()}>Record for review</button></div></Modal>}
  </div>;
}
