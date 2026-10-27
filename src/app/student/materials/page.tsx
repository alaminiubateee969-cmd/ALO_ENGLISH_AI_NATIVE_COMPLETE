"use client";

/**
 * /student/materials — the free study-material library.
 *
 * Every exam's practice material in one place: strategy guides for each of the
 * computer-based exams plus core grammar, vocabulary and skills references.
 * Content is served from the StudyMaterial table (the same library the RAG
 * study chat reads), so anything an admin uploads appears here instantly.
 * Everything is free and unlimited — there is no paywall to bypass.
 */

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { BookOpen, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/student/dashboard" },
  { label: "AI Teachers", href: "/student/ai-teachers" },
  { label: "Study Materials", href: "/student/materials" },
  { label: "Speaking conversation practice", href: "/live-exam" },
  { label: "Practice Tests", href: "/practice-test" },
  { label: "Course Finder", href: "/course-finder" },
  { label: "Scholarships", href: "/scholarships" },
  { label: "Logout", href: "/login" },
];

const CATEGORY_TABS = [
  { key: "", label: "All materials" },
  { key: "IELTS", label: "IELTS" },
  { key: "TOEFL", label: "TOEFL" },
  { key: "PTE", label: "PTE" },
  { key: "DUOLINGO", label: "Duolingo" },
  { key: "GRE", label: "GRE" },
  { key: "OET", label: "OET" },
  { key: "GRAMMAR", label: "Grammar" },
  { key: "VOCABULARY", label: "Vocabulary" },
  { key: "SPEAKING", label: "Speaking" },
  { key: "WRITING", label: "Writing" },
  { key: "GENERAL", label: "Study skills" },
];

type MaterialSummary = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  chunkCount: number;
};

type MaterialDetail = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content: string;
};

function MaterialsContent() {
  const [category, setCategory] = useState("");
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MaterialDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Promise chain in the effect (the codebase pattern): no state is written
  // synchronously during the effect. `loading` starts true and is re-armed by
  // the category buttons (event handlers may set state synchronously).
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    fetch(`/api/rag/materials${params.size ? `?${params.toString()}` : ""}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return;
        if (body.success) {
          setMaterials(body.data.materials ?? []);
          setError("");
        } else {
          setError(body.message || "Could not load materials.");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Network error while loading materials.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  /** Event-handler path: safe to set state synchronously here. */
  const switchCategory = useCallback((key: string) => {
    setOpenId(null);
    setDetail(null);
    setCategory(key);
    setLoading(true);
  }, []);

  const toggle = useCallback((id: string) => {
    setDetailLoading(true);
    setDetail(null);
    setOpenId(id);
    fetch(`/api/rag/materials/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((body) => {
        if (body.success) setDetail(body.data.material);
        else setError(body.message || "Could not open that material.");
      })
      .catch(() => setError("Network error while opening the material."))
      .finally(() => setDetailLoading(false));
  }, []);

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Study materials</h2>
        <p className="text-slate-600">
          Practice material for every exam — strategy guides, grammar references and vocabulary
          builders. All free, all unlimited.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => switchCategory(tab.key)}
            className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition ${
              category === tab.key
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-600">Loading materials…</p>
      ) : error ? (
        <p className="text-rose-600">{error}</p>
      ) : materials.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No materials in this category yet — check back soon.
        </div>
      ) : (
        <div className="space-y-4">
          {materials.map((m) => (
            <div key={m.id} className="rounded-xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => (openId === m.id ? setOpenId(null) : toggle(m.id))}
                className="flex w-full items-start gap-3 p-5 text-left"
                aria-expanded={openId === m.id}
              >
                <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <span className="flex-1">
                  <span className="block font-semibold text-slate-900">{m.title}</span>
                  {m.description ? (
                    <span className="mt-1 block text-sm text-slate-600">{m.description}</span>
                  ) : null}
                  <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {m.category}
                  </span>
                </span>
                {openId === m.id ? (
                  <ChevronUp className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                ) : (
                  <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                )}
              </button>
              {openId === m.id ? (
                <div className="border-t border-slate-100 px-5 py-4">
                  {detailLoading ? (
                    <p className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> Opening…
                    </p>
                  ) : detail ? (
                    <div className="max-w-3xl space-y-3 text-sm leading-7 text-slate-700">
                      {detail.content.split(/\n{2,}/).map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Could not open this material.</p>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function StudentMaterialsPage() {
  return (
    <DashboardShell title="Student Portal" nav={NAV} roles={["STUDENT"]}>
      <MaterialsContent />
    </DashboardShell>
  );
}
