"use client";

import { DashboardShell, DashboardCard, DashboardTable, useApi } from "@/components/site/dashboard-shell";
import { TrendingUp, Award, BookOpen } from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/student/dashboard" },
  { label: "Practice Tests", href: "/practice-test" },
  { label: "Exam History", href: "/student/exam-history" },
  { label: "Course Finder", href: "/course-finder" },
  { label: "Scholarships", href: "/scholarships" },
  { label: "Logout", href: "/login" },
];

function ExamHistoryContent() {
  const { data: attemptsData, loading } = useApi<{
    attempts: Array<{
      id: string;
      status: string;
      startedAt: string;
      submittedAt: string | null;
      examType: { code: string; name: string };
      practiceSet: { title: string };
      score: { overall: number; listening: number | null; reading: number | null; writing: number | null; speaking: number | null; confidence: null; confidenceCalibrated: false; providerUsed: string; isOfficialScore: false } | null;
    }>;
    pagination: { total: number };
  }>("/api/attempts?limit=50");

  // Calculate stats
  const submitted = attemptsData?.attempts?.filter((attempt) => attempt.status === "SUBMITTED") || [];
  const scored = submitted.filter((attempt) => attempt.score !== null);
  const avgScore = scored.length > 0
    ? (scored.reduce((sum, attempt) => sum + (attempt.score?.overall ?? 0), 0) / scored.length).toFixed(1)
    : "—";
  const bestScore = scored.length > 0
    ? Math.max(...scored.map((attempt) => attempt.score?.overall ?? 0)).toFixed(1)
    : "—";

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">My Practice Attempts</h2>
        <p className="text-slate-600">Track submitted attempts. Numeric indicators are generic, unvalidated practice feedback—not official exam scores.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <DashboardCard title="Attempts" value={attemptsData?.pagination?.total ?? 0} desc="Including in-progress attempts" icon={BookOpen} />
        <DashboardCard title="Average Indicator" value={avgScore} desc="Unvalidated 0–9 practice indicator" icon={TrendingUp} />
        <DashboardCard title="Best Indicator" value={bestScore} desc="Not an official band or scaled score" icon={Award} />
      </div>

      {/* Attempt History */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">Loading your exam history...</div>
      ) : submitted.length > 0 ? (
        <div className="space-y-4">
          {submitted.map((attempt) => (
            <div key={attempt.id} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{attempt.practiceSet.title}</h3>
                  <p className="text-sm text-slate-500">
                    {attempt.examType.name} · Submitted: {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-700">{attempt.score?.overall ?? "—"}</p>
                  <p className="text-xs text-slate-400">{attempt.score ? "Practice indicator (0–9)" : "No numeric result"}</p>
                </div>
              </div>
              {attempt.score && (
                <div className="grid grid-cols-4 gap-2">
                  <div className="rounded border p-2 text-center"><p className="text-xs text-slate-400">Listening</p><p className="font-bold">{attempt.score.listening ?? "—"}</p></div>
                  <div className="rounded border p-2 text-center"><p className="text-xs text-slate-400">Reading</p><p className="font-bold">{attempt.score.reading ?? "—"}</p></div>
                  <div className="rounded border p-2 text-center"><p className="text-xs text-slate-400">Writing</p><p className="font-bold">{attempt.score.writing ?? "—"}</p></div>
                  <div className="rounded border p-2 text-center"><p className="text-xs text-slate-400">Speaking</p><p className="font-bold">{attempt.score.speaking ?? "—"}</p></div>
                </div>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span>Calibration: not validated</span>
                <span>·</span>
                <span>Method: {attempt.score?.providerUsed || "—"}</span>
                <span>·</span>
                <span>Not an official provider score</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500 mb-2">No completed exams yet.</p>
          <a href="/practice-test" className="text-blue-600 font-semibold hover:underline">
            Take your first practice test →
          </a>
        </div>
      )}
    </>
  );
}

export default function ExamHistoryPage() {
  return (
    <DashboardShell title="Student Portal" nav={NAV} role="STUDENT">
      <ExamHistoryContent />
    </DashboardShell>
  );
}
