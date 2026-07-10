"use client";

import { useState, useEffect } from "react";
import {
  Folder, FileText, FileCode, Database, Settings as SettingsIcon, Download,
  Eye, X, ChevronRight, ChevronDown, ShieldCheck, CheckCircle2, FileSpreadsheet,
  Clock, FileCheck, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Entry = {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
  children?: Entry[];
};

type FlatFile = { path: string; size: number; ext: string };

const FILE_ICONS: Record<string, any> = {
  md: FileText, sql: Database, php: FileCode, htaccess: ShieldCheck,
  env: SettingsIcon, example: SettingsIcon, txt: FileText, json: FileCode,
};

const CATEGORIES = [
  { id: "all", label: "All Files", filter: () => true },
  { id: "database", label: "Database", filter: (f: FlatFile) => f.path.startsWith("database/") },
  { id: "docs", label: "Documentation", filter: (f: FlatFile) => f.path.startsWith("docs/") || f.path.endsWith("DEVELOPMENT-GUIDELINE.md") },
  { id: "app", label: "PHP App", filter: (f: FlatFile) => f.path.startsWith("app/") },
  { id: "config", label: "Config", filter: (f: FlatFile) => f.path.startsWith("config/") },
  { id: "cron", label: "Cron Jobs", filter: (f: FlatFile) => f.path.startsWith("cron/") },
  { id: "scripts", label: "Scripts", filter: (f: FlatFile) => f.path.startsWith("scripts/") },
  { id: "reports", label: "Reports", filter: (f: FlatFile) => f.path.startsWith("reports/") },
];

export function ProductionDeliverables() {
  const [files, setFiles] = useState<FlatFile[]>([]);
  const [tree, setTree] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<{ path: string; content: string; loading: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/deliverables")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setFiles(d.files);
          setTree(d.tree);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = files.filter((f) => {
    const c = CATEGORIES.find((c) => c.id === cat);
    if (c && !c.filter(f)) return false;
    if (search && !f.path.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openPreview = async (path: string) => {
    setPreview({ path, content: "", loading: true });
    try {
      const res = await fetch(`/api/deliverable?file=${encodeURIComponent(path)}`);
      const text = await res.text();
      setPreview({ path, content: text, loading: false });
    } catch {
      setPreview({ path, content: "Failed to load file.", loading: false });
    }
  };

  const downloadFile = (path: string) => {
    window.open(`/api/deliverable?file=${encodeURIComponent(path)}&download=1`, "_blank");
  };

  const fmtSize = (b: number) => (b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(2)} MB`);

  // Stats
  const stats = [
    { label: "Production files", value: files.length, icon: FileCheck },
    { label: "Database tables", value: 44, icon: Database },
    { label: "Practice sets", value: 320, icon: FileSpreadsheet },
    { label: "Exams", value: 32, icon: CheckCircle2 },
  ];

  return (
    <section id="production" className="py-16 lg:py-24 bg-alo-soft-gray">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl">
          <div className="text-sm font-bold uppercase tracking-wide text-alo-orange">cPanel Production Package</div>
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-alo-navy">Production-ready cPanel deliverables.</h2>
          <p className="mt-4 text-base md:text-lg leading-8 text-alo-muted">
            Full PHP 8.2+ / MySQL 8 cPanel deployment package: 44 database tables, 320 practice sets (10 per exam × 32 exams), weekly question update cron, exam conduct guide, audit scripts, and 9 production reports. Browse, preview, and download any file.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-alo-card bg-white p-4 alo-shadow-sm">
              <s.icon className="h-5 w-5 text-alo-blue" />
              <div className="mt-1.5 text-3xl font-extrabold text-alo-navy">{s.value}</div>
              <div className="text-xs text-alo-faint">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Compliance banner */}
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-alo-success mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-bold text-alo-navy">17/17 production QA checks PASS</div>
            <p className="text-xs text-alo-muted mt-0.5">Backend-enforced free quota · RBAC · CSRF · audit logs · private storage blocked · weekly update no auto-publish · original content only · no official exam questions · no fake examiner wording.</p>
          </div>
        </div>

        {/* Filters + search */}
        <div className="mt-8 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const count = c.id === "all" ? files.length : files.filter(c.filter).length;
              return (
                <button key={c.id} onClick={() => setCat(c.id)} className={cn("rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all", cat === c.id ? "border-transparent bg-alo-navy text-white" : "border-slate-200 bg-white text-alo-navy hover:bg-alo-soft-blue")}>
                  {c.label} ({count})
                </button>
              );
            })}
          </div>
          <div className="relative lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-faint" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files…" className="w-full h-10 rounded-xl border border-slate-200 pl-9 pr-3 text-sm focus:outline-none focus:border-alo-blue" />
          </div>
        </div>

        {/* File list */}
        <div className="mt-6 rounded-2xl border border-alo-card bg-white alo-shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-sm text-alo-faint">Loading production files…</div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto alo-scroll">
              {filtered.map((f) => {
                const Icon = FILE_ICONS[f.ext] || FileText;
                const name = f.path.split("/").pop();
                const dir = f.path.includes("/") ? f.path.split("/").slice(0, -1).join("/") + "/" : "";
                return (
                  <div key={f.path} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-alo-soft-blue text-alo-blue"><Icon className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-alo-navy truncate">{name}</div>
                      <div className="text-[11px] text-alo-faint truncate"><span className="font-mono">{dir}</span> · {fmtSize(f.size)}</div>
                    </div>
                    <button onClick={() => openPreview(f.path)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-alo-faint hover:bg-alo-soft-blue hover:text-alo-blue" title="Preview">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => downloadFile(f.path)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-alo-faint hover:bg-alo-soft-orange hover:text-alo-orange" title="Download">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              {filtered.length === 0 && <div className="p-10 text-center text-sm text-alo-faint">No files match.</div>}
            </div>
          )}
        </div>

        {/* Key deliverables quick-access */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "DEVELOPMENT-GUIDELINE.md", path: "DEVELOPMENT-GUIDELINE.md", desc: "Full dev guide: project identity, where to edit, cPanel rules, build commands, production checklist", icon: FileText },
            { name: "install.sql", path: "database/install.sql", desc: "44 MySQL 8 tables with FKs, indexes, utf8mb4. Includes exam_types seed for 32 exams.", icon: Database },
            { name: "question_sets_seed.sql", path: "database/question_sets_seed.sql", desc: "320 practice sets (10 per exam) with sections, scoring rules, disclaimers, versions.", icon: FileSpreadsheet },
            { name: "EXAM_CONDUCT_GUIDE.md", path: "docs/EXAM_CONDUCT_GUIDE.md", desc: "All 32 exams explained: sections, timing, equipment, before/during/after, disclaimers.", icon: FileCheck },
            { name: "weekly_question_update.php", path: "cron/weekly_question_update.php", desc: "12-step weekly pipeline: draft → duplicate check → quality → reviewer → admin approval. No auto-publish.", icon: Clock },
            { name: "08_FINAL_PRODUCTION_STATUS.md", path: "reports/08_FINAL_PRODUCTION_STATUS.md", desc: "17/17 QA checks PASS. Final status: PRODUCTION READY.", icon: CheckCircle2 },
          ].map((d) => (
            <div key={d.path} className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm hover:alo-shadow-lg transition-all">
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-alo-soft-blue text-alo-blue"><d.icon className="h-5 w-5" /></div>
                <div className="flex gap-1">
                  <button onClick={() => openPreview(d.path)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-alo-faint hover:bg-alo-soft-blue hover:text-alo-blue"><Eye className="h-4 w-4" /></button>
                  <button onClick={() => downloadFile(d.path)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-alo-faint hover:bg-alo-soft-orange hover:text-alo-orange"><Download className="h-4 w-4" /></button>
                </div>
              </div>
              <h3 className="mt-3 text-sm font-bold text-alo-navy font-mono break-all">{d.name}</h3>
              <p className="mt-1 text-xs text-alo-faint leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-alo-navy/70 backdrop-blur-sm" onClick={() => setPreview(null)} />
          <div className="relative w-full max-w-4xl h-[85vh] rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 bg-slate-50">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-alo-blue shrink-0" />
                <span className="text-sm font-mono font-semibold text-alo-navy truncate">{preview.path}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => downloadFile(preview.path)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-alo-faint hover:bg-alo-soft-orange hover:text-alo-orange"><Download className="h-4 w-4" /></button>
                <button onClick={() => setPreview(null)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-alo-faint hover:bg-slate-100"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto alo-scroll bg-slate-900 p-5">
              {preview.loading ? (
                <div className="text-slate-400 text-sm">Loading…</div>
              ) : (
                <pre className="text-slate-200 text-xs leading-relaxed font-mono whitespace-pre-wrap break-all">{preview.content}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
