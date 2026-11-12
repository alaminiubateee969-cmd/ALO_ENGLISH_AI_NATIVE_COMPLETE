"use client";

/**
 * src/components/exam/BandScoreReport.tsx
 *
 * Auto-grading report for the Listening / Reading objective sections.
 *
 * Takes the server-graded `objective` summary (correct/total per section)
 * plus the exam code, and renders:
 *   - Per-section band score (Listening, Reading) using the IELTS raw → band
 *     conversion tables in @/lib/exam/band-score.
 *   - An overall band indicator (mean of the four section bands, rounded to
 *     the nearest 0.5 using the official IELTS rule).
 *   - The raw-score breakdown (correct/total) per section, including the
 *     non-band-graded sections (Writing, Speaking — shown as "subjective").
 *
 * The report is a PRACTICE INDICATOR — not an official score. The
 * disclosure text makes that explicit so a candidate cannot quote the
 * number as an IELTS result.
 */

import { useMemo } from "react";
import { Award, BarChart3 } from "lucide-react";
import {
  ieltsOverallBand,
  ieltsSectionBand,
} from "@/lib/exam/band-score";

type SectionSummary = {
  section: string;
  correct: number;
  total: number;
};

type BandScoreReportProps = {
  /** Server-graded objective summary (correct/total per section). */
  objective: {
    correct: number;
    total: number;
    sections: SectionSummary[];
  } | null;
  /** Exam code (e.g. IELTS_ACADEMIC, IELTS_GT, TOEFL_IBT, …). */
  examCode: string;
  /** Optional overall score from the server's attempt evaluation. */
  serverOverall?: number | null;
};

export function BandScoreReport({ objective, examCode, serverOverall }: BandScoreReportProps) {
  // ─── Per-section band lookup ───────────────────────────────────────────
  const sectionBands = useMemo(() => {
    if (!objective) return [];
    return objective.sections.map((s) => {
      const band = ieltsSectionBand(s.section, s.correct, s.total, examCode);
      const isListening = s.section.toUpperCase() === "LISTENING";
      const isReading = s.section.toUpperCase() === "READING";
      return {
        ...s,
        band,
        bandGraded: band !== null,
        table: isListening
          ? "Listening"
          : isReading
            ? examCode.toUpperCase().includes("GENERAL") || examCode.toUpperCase().includes("GT")
              ? "Reading (General Training)"
              : "Reading (Academic)"
            : null,
        percentage: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
      };
    });
  }, [objective, examCode]);

  // ─── Overall band — mean of the four section bands ────────────────────
  const overallBand = useMemo(() => {
    const validBands = sectionBands
      .filter((s) => s.band !== null)
      .map((s) => s.band as number);
    // If we have at least one band, compute the overall using the IELTS rule.
    // (Subjective sections are skipped — the report cannot produce a true
    // overall without Writing/Speaking bands, but the practice indicator is
    // still useful with just L+R.)
    if (validBands.length === 0) return null;
    return ieltsOverallBand(validBands);
  }, [sectionBands]);

  if (!objective || objective.total === 0) {
    return null;
  }

  const code = examCode.toUpperCase();
  const isIeltsFamily = code.includes("IELTS");

  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-emerald-600" />
        <h2 className="text-xl font-bold text-slate-900">Auto-graded band score report</h2>
      </div>

      <p className="mb-4 text-sm text-slate-600">
        Listening and Reading answers are auto-graded against the stored answer key the moment
        you submit. The band conversion below uses the public IELTS raw-score → band tables
        (Listening and Academic Reading unless the exam is explicitly General Training). The
        overall indicator is the mean of the available section bands, rounded to the nearest
        0.5 using the official IELTS rule.
      </p>

      {/* Overall band — large */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-sm font-medium text-slate-500">
            {isIeltsFamily ? "Overall practice band" : "Practice indicator"}
          </p>
          <p className="text-5xl font-bold text-emerald-700">
            {overallBand !== null ? overallBand.toFixed(1) : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-400">out of 9.0</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-6 text-center">
          <p className="text-sm font-medium text-slate-500">Objective accuracy</p>
          <p className="text-3xl font-bold text-slate-900">
            {objective.correct}
            <span className="text-lg text-slate-400">/{objective.total}</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {Math.round((objective.correct / objective.total) * 100)}% correct
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 p-6 text-center">
          <p className="text-sm font-medium text-slate-500">Server evaluation</p>
          <p className="text-3xl font-bold text-slate-900">
            {serverOverall !== null && serverOverall !== undefined ? serverOverall : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-400">includes subjective feedback</p>
        </div>
      </div>

      {/* Per-section band breakdown */}
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 font-semibold">Section</th>
              <th className="px-4 py-2 font-semibold">Raw score</th>
              <th className="px-4 py-2 font-semibold">Accuracy</th>
              <th className="px-4 py-2 font-semibold">Band table</th>
              <th className="px-4 py-2 text-right font-semibold">Band</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sectionBands.map((s) => (
              <tr key={s.section} className="bg-white">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {s.section.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  <span className="font-mono">{s.correct}/{s.total}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${s.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{s.percentage}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {s.bandGraded ? s.table : "subjective — no band"}
                </td>
                <td className="px-4 py-3 text-right">
                  {s.bandGraded ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono text-sm font-bold text-emerald-700">
                      <Award className="h-3 w-3" />
                      {s.band!.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Disclosure */}
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
        <strong>Not an official score.</strong> The band conversion above is a practice
        indicator only. Official IELTS scores are issued by the test centre after a trained
        examiner marks the Writing and Speaking sections; this report cannot replicate that.
        Writing and Speaking rows show no band because those sections are graded qualitatively
        by the ALO evaluation agent — see the feedback below.
      </div>
    </div>
  );
}

export default BandScoreReport;
