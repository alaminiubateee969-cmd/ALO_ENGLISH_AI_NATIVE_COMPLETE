"use client";

/**
 * src/components/alo/exam-content-manager.tsx
 *
 * Admin exam-content manager: create/activate/deactivate/delete practice sets
 * and add/delete their questions against the /api/admin/practice-sets and
 * /api/admin/questions APIs. Question drafts are checked client-side with the
 * same validator the API enforces so feedback is instant (the API remains
 * authoritative).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, PencilLine, Plus, Power, RefreshCw, Trash2, XCircle } from "lucide-react";

import { ALL_QUESTION_TYPES, validateQuestionDraft } from "@/lib/exam/question-validation";

type ExamTypeRef = { id: string; code: string; name: string };
type PracticeSet = {
  id: string;
  title: string;
  description: string | null;
  durationMin: number;
  isActive: boolean;
  examType: ExamTypeRef;
  _count: { questions: number; attempts: number };
};
type Question = {
  id: string;
  section: string;
  type: string;
  prompt: string;
  passage: string | null;
  options: string | null;
  correctAnswer: string | null;
  correctIndex: number | null;
  correctIndices: string | null;
  wordLimit: number | null;
  points: number;
  order: number;
};

const INDEX_TYPES = new Set(["MULTIPLE_CHOICE", "TRUE_FALSE", "TRUE_FALSE_NOT_GIVEN", "READING_MCQ", "READ_AND_SELECT", "LISTEN_AND_SELECT"]);
const SET_TYPES = new Set(["MATCHING", "LABELING"]);
const TEXT_TYPES = new Set(["FILL_BLANK", "SHORT_ANSWER", "SENTENCE_COMPLETION", "SUMMARY_COMPLETION", "WRITE_FROM_DICTATION", "COMPLETE_THE_SENTENCE"]);

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = (await res.json().catch(() => null)) as { success?: boolean; data?: T; message?: string } | null;
  if (!res.ok || !body?.success) {
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
  return body.data as T;
}

function keySummary(q: Question): string {
  if (q.correctIndices) return `indices ${q.correctIndices}`;
  if (q.correctIndex !== null) return `option #${q.correctIndex + 1}`;
  if (q.correctAnswer) return `“${q.correctAnswer.slice(0, 40)}”`;
  return "subjective / no key";
}

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500";
const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
const btnCls =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50";

export function ExamContentManager() {
  const [sets, setSets] = useState<PracticeSet[]>([]);
  const [loadingSets, setLoadingSets] = useState(true);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // New-set form
  const [newTitle, setNewTitle] = useState("");
  const [newDuration, setNewDuration] = useState(60);
  const [newExamCode, setNewExamCode] = useState("IELTS-A");

  // New-question form
  const [qType, setQType] = useState("MULTIPLE_CHOICE");
  const [qSection, setQSection] = useState("READING");
  const [qPrompt, setQPrompt] = useState("");
  const [qPassage, setQPassage] = useState("");
  const [qOptions, setQOptions] = useState("");
  const [qCorrectIndex, setQCorrectIndex] = useState(0);
  const [qCorrectIndices, setQCorrectIndices] = useState("");
  const [qCorrectAnswer, setQCorrectAnswer] = useState("");
  const [qWordLimit, setQWordLimit] = useState("");

  const examCodes = useMemo(() => {
    const fromSets = new Map(sets.map((s) => [s.examType.code, s.examType.name]));
    return [...fromSets.entries()];
  }, [sets]);

  const selectedSet = sets.find((s) => s.id === selectedSetId) ?? null;

  const loadSets = useCallback(
    () =>
      api<{ practiceSets: PracticeSet[] }>("/api/admin/practice-sets")
        .then((data) => setSets(data.practiceSets))
        .catch((e: unknown) =>
          setNotice({ kind: "err", text: e instanceof Error ? e.message : "Failed to load practice sets" }),
        )
        .finally(() => setLoadingSets(false)),
    [],
  );

  const loadQuestions = useCallback(
    (setId: string) =>
      api<{ questions: Question[] }>(`/api/admin/practice-sets/${setId}/questions`)
        .then((data) => setQuestions(data.questions))
        .catch((e: unknown) =>
          setNotice({ kind: "err", text: e instanceof Error ? e.message : "Failed to load questions" }),
        )
        .finally(() => setLoadingQuestions(false)),
    [],
  );

  useEffect(() => {
    void loadSets();
  }, [loadSets]);

  useEffect(() => {
    if (selectedSetId) void loadQuestions(selectedSetId);
  }, [selectedSetId, loadQuestions]);

  async function run(action: () => Promise<void>, successText: string) {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      setNotice({ kind: "ok", text: successText });
    } catch (e) {
      setNotice({ kind: "err", text: e instanceof Error ? e.message : "Something went wrong" });
    } finally {
      setBusy(false);
    }
  }

  const optionList = qOptions.split("\n").map((o) => o.trim()).filter(Boolean);

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Content Manager</h3>
        <button className={btnCls} onClick={() => { setLoadingSets(true); void loadSets(); }} disabled={busy || loadingSets}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {notice && (
        <div
          className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
            notice.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {notice.kind === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Create practice set */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h4 className="mb-3 font-semibold">Create practice set (starts as draft)</h4>
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className={labelCls}>Exam type code</label>
            <input className={inputCls} value={newExamCode} onChange={(e) => setNewExamCode(e.target.value)} placeholder="IELTS-A" />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Title</label>
            <input className={inputCls} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="IELTS Academic — Reading Set 9" />
          </div>
          <div>
            <label className={labelCls}>Duration (minutes)</label>
            <input className={inputCls} type="number" min={1} max={600} value={newDuration} onChange={(e) => setNewDuration(Number(e.target.value))} />
          </div>
        </div>
        <button
          className={`${btnCls} mt-3 bg-slate-900 text-white hover:bg-slate-800`}
          disabled={busy || newTitle.trim().length < 3 || newExamCode.trim().length === 0}
          onClick={() =>
            void run(async () => {
              const data = await api<{ practiceSet: PracticeSet }>("/api/admin/practice-sets", {
                method: "POST",
                body: JSON.stringify({ examTypeCode: newExamCode.trim(), title: newTitle.trim(), durationMin: newDuration }),
              });
              setNewTitle("");
              await loadSets();
              setLoadingQuestions(true);
              setSelectedSetId(data.practiceSet.id);
            }, "Practice set created as a draft. Add questions, then activate it.")
          }
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Create draft set
        </button>
        {examCodes.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">Codes already in use: {examCodes.map(([c]) => c).join(", ")}</p>
        )}
      </div>

      {/* Practice sets table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Set</th>
              <th className="px-4 py-3">Exam</th>
              <th className="px-4 py-3">Questions</th>
              <th className="px-4 py-3">Attempts</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingSets ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading practice sets…</td></tr>
            ) : sets.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No practice sets yet. Create one above.</td></tr>
            ) : (
              sets.map((s) => (
                <tr key={s.id} className={`border-b border-slate-100 ${selectedSetId === s.id ? "bg-slate-50" : ""}`}>
                  <td className="px-4 py-3 font-medium">{s.title}<span className="block text-xs font-normal text-slate-400">{s.durationMin} min</span></td>
                  <td className="px-4 py-3 font-mono text-xs">{s.examType.code}</td>
                  <td className="px-4 py-3">{s._count.questions}</td>
                  <td className="px-4 py-3">{s._count.attempts}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.isActive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
                      {s.isActive ? "Active" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        className={btnCls}
                        disabled={busy}
                        onClick={() => {
                          if (selectedSetId === s.id) {
                            setSelectedSetId(null);
                            setQuestions([]);
                          } else {
                            setLoadingQuestions(true);
                            setSelectedSetId(s.id);
                          }
                        }}
                      >
                        <PencilLine className="h-3.5 w-3.5" /> Questions
                      </button>
                      <button
                        className={btnCls}
                        disabled={busy || (!s.isActive && s._count.questions === 0)}
                        title={!s.isActive && s._count.questions === 0 ? "Add at least one question before activating" : undefined}
                        onClick={() =>
                          void run(async () => {
                            await api(`/api/admin/practice-sets/${s.id}`, {
                              method: "PATCH",
                              body: JSON.stringify({ isActive: !s.isActive }),
                            });
                            await loadSets();
                          }, s.isActive ? "Set deactivated." : "Set activated — students can now take it.")
                        }
                      >
                        <Power className="h-3.5 w-3.5" /> {s.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        className={`${btnCls} text-red-700`}
                        disabled={busy || s._count.attempts > 0}
                        title={s._count.attempts > 0 ? "Sets with attempts cannot be deleted; deactivate instead" : undefined}
                        onClick={() =>
                          void run(async () => {
                            await api(`/api/admin/practice-sets/${s.id}`, { method: "DELETE" });
                            if (selectedSetId === s.id) setSelectedSetId(null);
                            await loadSets();
                          }, "Practice set deleted.")
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Question manager for the selected set */}
      {selectedSet && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h4 className="font-semibold">Questions in “{selectedSet.title}”</h4>

          {loadingQuestions ? (
            <p className="py-6 text-center text-sm text-slate-400">Loading questions…</p>
          ) : questions.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No questions yet — add the first one below.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {questions.map((q) => (
                <li key={q.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-500">
                      #{q.order + 1} · {q.section} · {q.type} · {q.points} pt
                    </div>
                    <p className="truncate text-sm font-medium">{q.prompt}</p>
                    <p className="text-xs text-slate-500">Key: {keySummary(q)}</p>
                  </div>
                  <button
                    className={`${btnCls} shrink-0 text-red-700`}
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await api(`/api/admin/questions/${q.id}`, { method: "DELETE" });
                        await Promise.all([loadQuestions(selectedSet.id), loadSets()]);
                      }, "Question deleted.")
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 border-t border-slate-100 pt-5">
            <h5 className="mb-3 font-semibold">Add question</h5>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className={labelCls}>Type</label>
                <select className={inputCls} value={qType} onChange={(e) => setQType(e.target.value)}>
                  {[...ALL_QUESTION_TYPES].sort().map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Section</label>
                <input className={inputCls} value={qSection} onChange={(e) => setQSection(e.target.value)} placeholder="READING" />
              </div>
              <div>
                <label className={labelCls}>Word limit (optional)</label>
                <input className={inputCls} type="number" min={1} value={qWordLimit} onChange={(e) => setQWordLimit(e.target.value)} placeholder="250" />
              </div>
            </div>
            <div className="mt-3">
              <label className={labelCls}>Prompt</label>
              <textarea className={inputCls} rows={3} value={qPrompt} onChange={(e) => setQPrompt(e.target.value)} />
            </div>
            <div className="mt-3">
              <label className={labelCls}>Passage / transcript (optional)</label>
              <textarea className={inputCls} rows={3} value={qPassage} onChange={(e) => setQPassage(e.target.value)} />
            </div>

            {(INDEX_TYPES.has(qType) || SET_TYPES.has(qType)) && (
              <>
                <div className="mt-3">
                  <label className={labelCls}>Options (one per line)</label>
                  <textarea className={inputCls} rows={4} value={qOptions} onChange={(e) => setQOptions(e.target.value)} placeholder={"Option A\nOption B\nOption C"} />
                </div>
                {INDEX_TYPES.has(qType) && optionList.length > 0 && (
                  <div className="mt-3 max-w-xs">
                    <label className={labelCls}>Correct option</label>
                    <select className={inputCls} value={qCorrectIndex} onChange={(e) => setQCorrectIndex(Number(e.target.value))}>
                      {optionList.map((o, i) => (
                        <option key={i} value={i}>{`#${i + 1} — ${o.slice(0, 50)}`}</option>
                      ))}
                    </select>
                  </div>
                )}
                {SET_TYPES.has(qType) && (
                  <div className="mt-3 max-w-xs">
                    <label className={labelCls}>Correct option numbers (comma-separated, 1-based)</label>
                    <input className={inputCls} value={qCorrectIndices} onChange={(e) => setQCorrectIndices(e.target.value)} placeholder="1, 3" />
                  </div>
                )}
              </>
            )}

            {(TEXT_TYPES.has(qType) || qType === "TRUE_FALSE" || qType === "TRUE_FALSE_NOT_GIVEN") && (
              <div className="mt-3 max-w-md">
                <label className={labelCls}>Correct answer{TEXT_TYPES.has(qType) ? "" : " (alternative to picking an option)"}</label>
                <input className={inputCls} value={qCorrectAnswer} onChange={(e) => setQCorrectAnswer(e.target.value)} />
              </div>
            )}

            <button
              className={`${btnCls} mt-4 bg-slate-900 text-white hover:bg-slate-800`}
              disabled={busy}
              onClick={() => {
                const draft = {
                  section: qSection.trim(),
                  type: qType,
                  prompt: qPrompt,
                  passage: qPassage.trim() || null,
                  options: INDEX_TYPES.has(qType) || SET_TYPES.has(qType) ? optionList : null,
                  correctIndex: INDEX_TYPES.has(qType) ? qCorrectIndex : null,
                  correctIndices: SET_TYPES.has(qType)
                    ? qCorrectIndices.split(",").map((n) => Number(n.trim()) - 1).filter((n) => Number.isInteger(n) && n >= 0)
                    : null,
                  correctAnswer: qCorrectAnswer.trim() || null,
                  wordLimit: qWordLimit ? Number(qWordLimit) : null,
                };
                const check = validateQuestionDraft(draft);
                if (!check.ok) {
                  setNotice({ kind: "err", text: `Question is not valid: ${check.issues.join("; ")}` });
                  return;
                }
                void run(async () => {
                  await api(`/api/admin/practice-sets/${selectedSet.id}/questions`, {
                    method: "POST",
                    body: JSON.stringify(draft),
                  });
                  setQPrompt("");
                  setQPassage("");
                  setQOptions("");
                  setQCorrectIndices("");
                  setQCorrectAnswer("");
                  await Promise.all([loadQuestions(selectedSet.id), loadSets()]);
                }, "Question added.");
              }}
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
