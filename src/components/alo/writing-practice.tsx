"use client";

/**
 * src/components/alo/writing-practice.tsx
 *
 * Writing practice with optional grammar and style feedback.
 *
 * The feedback panel exists to be honest about three things:
 *
 *   1. **It is not a score.** A LanguageTool service finds spelling, grammar and
 *      wording issues. It cannot tell a learner whether their argument is
 *      convincing or their essay answers the prompt, and a number invented here
 *      would be worse than no number at all.
 *   2. **It is optional infrastructure.** If the operator has not configured the
 *      service, or it is down, the panel says so in one line and the practice
 *      still works. A learner is never blocked by a sidecar.
 *   3. **Suggestions are for the learner's judgement.** Each one shows what was
 *      flagged and what the engine proposed, and the learner decides. "Apply
 *      every suggestion" is deliberately not offered: mechanically accepting
 *      style advice is how writing practice makes writing worse.
 *
 * The text is never stored: a check is a question about a draft, not a
 * submission.
 */

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, PenLine, Wand2 } from "lucide-react";

type Suggestion = {
  message: string;
  shortMessage?: string;
  offset: number;
  length: number;
  replacements: string[];
  ruleId: string;
  category: string;
  issueType: string;
};

type CheckResponse = {
  status: "ok" | "disabled" | "unavailable" | "too_long" | "empty";
  language: string | null;
  summary: string | null;
  groups: Array<{ issueType: string; items: Suggestion[] }>;
  suggestions: Suggestion[];
  note: string | null;
  maxChars: number;
};

const ISSUE_LABEL: Record<string, string> = {
  grammar: "Grammar",
  misspelling: "Spelling",
  typography: "Punctuation & typography",
  duplication: "Repeated words",
  style: "Style & wording",
  other: "Other",
};

const PROMPTS = [
  {
    id: "task2-agree",
    label: "Academic essay: agree or disagree",
    prompt:
      "Some people believe that studying abroad is the only way to build an international career. To what extent do you agree or disagree? Write at least 250 words.",
  },
  {
    id: "task2-problem",
    label: "Academic essay: problem and solution",
    prompt:
      "Many students find it difficult to prepare for an English test while studying full time. What problems does this cause, and what measures could solve them? Write at least 250 words.",
  },
  {
    id: "formal-letter",
    label: "Formal letter",
    prompt:
      "Write a letter to a university admissions office asking about the documents required for your application and the deadline for the intake you are targeting. Write at least 150 words.",
  },
] as const;

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function quoted(text: string, suggestion: Suggestion): string {
  const slice = text.slice(suggestion.offset, suggestion.offset + Math.max(suggestion.length, 1));
  return slice.trim() || "(punctuation or spacing)";
}

export function WritingPractice() {
  const [promptId, setPromptId] = useState<string>(PROMPTS[0].id);
  const [text, setText] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [error, setError] = useState("");

  const activePrompt = PROMPTS.find((prompt) => prompt.id === promptId) ?? PROMPTS[0];
  const words = wordCount(text);

  async function check() {
    setChecking(true);
    setError("");
    try {
      const response = await fetch("/api/grammar/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: "en-GB" }),
      });
      const payload = await response.json();
      if (!payload.success) {
        setError(payload.message || "The grammar check could not run.");
        setResult(null);
        return;
      }
      setResult(payload.data);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setChecking(false);
    }
  }

  return (
    <section id="writing-practice" className="bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-alo-orange/20 bg-alo-soft-orange px-3 py-1 text-xs font-semibold text-alo-orange">
            <PenLine className="h-3.5 w-3.5" />
            Writing practice
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-alo-navy">Write, then check your language</h2>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-alo-muted">
            Draft your answer to a practice prompt and ask for grammar and wording feedback. The checker flags language
            issues — it does not score your writing, does not judge whether you answered the question, and cannot tell
            you what band a real examiner would give. Your text is not saved.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Practice prompt</label>
              <select
                value={promptId}
                onChange={(event) => setPromptId(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {PROMPTS.map((prompt) => (
                  <option key={prompt.id} value={prompt.id}>
                    {prompt.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{activePrompt.prompt}</p>
              <p className="mt-2 text-xs text-slate-500">
                These are practice prompts written for this page, not official exam questions, and the topics are not taken
                from any test provider&rsquo;s papers.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Your answer</label>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={12}
                placeholder="Write your response here…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-relaxed"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>
                  {words} word{words === 1 ? "" : "s"} · {text.length} characters
                  {result ? ` · checker accepts up to ${result.maxChars}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => void check()}
                  disabled={checking || text.trim().length === 0}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-alo-orange px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                  {checking ? "Checking…" : "Check grammar & style"}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
              {result.status === "ok" && result.suggestions.length === 0 && (
                <p className="flex items-center gap-2 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" /> No grammar, spelling or wording issues were detected in this draft.
                </p>
              )}

              {result.status !== "ok" && (
                <p className="text-sm text-slate-700">
                  {result.summary ?? "Grammar feedback is not available right now. Your practice is unaffected."}
                </p>
              )}

              {result.summary && result.status === "ok" && result.suggestions.length > 0 && (
                <p className="text-sm font-medium text-slate-800">{result.summary}</p>
              )}

              {result.groups.length > 0 && (
                <ul className="mt-4 space-y-4">
                  {result.groups.map((group) => (
                    <li key={group.issueType}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {ISSUE_LABEL[group.issueType] ?? group.issueType} · {group.items.length}
                      </p>
                      <ul className="mt-2 space-y-2">
                        {group.items.map((suggestion, index) => (
                          <li key={`${suggestion.ruleId}-${suggestion.offset}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
                            <p className="text-xs text-slate-500">
                              “{quoted(text, suggestion)}”
                            </p>
                            <p className="mt-1 text-sm text-slate-800">{suggestion.message}</p>
                            {suggestion.replacements.length > 0 && (
                              <p className="mt-1 text-xs text-slate-600">
                                Suggested:{" "}
                                {suggestion.replacements.slice(0, 4).map((replacement) => (
                                  <span key={replacement} className="mr-2 inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-800">
                                    {replacement}
                                  </span>
                                ))}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-4 text-xs text-slate-500">
                {result.note ??
                  "Each suggestion is a hint from a grammar service. Decide for yourself whether it improves your meaning — the checker cannot see your argument."}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
