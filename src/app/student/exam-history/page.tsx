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
      score: { overall: number; listening: number; reading: number; writing: number; speaking: number; confidence: number; providerUsed: string } | null;
    }>;
    pagination: { total: number };
  }>("/api/attempts?limit=50");

  // Calculate stats
  const completed = attemptsData?.attempts?.filter((a) => a.status === "SUBMITTED" && a.score) || [];
  const avgScore = completed.length > 0
    ? (completed.reduce((sum, a) => sum + (a.score?.overall || 0), 0) / completed.length).toFixed(1)
    : "0";
  const bestScore = completed.length > 0
    ? Math.max(...completed.map((a) => a.score?.overall || 0)).toFixed(1)
    : "0";

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">My Exam History</h2>
        <p className="text-slate-600">Track your practice test progress and scores</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <DashboardCard title="Tests Taken" value={attemptsData?.pagination?.total ?? 0} desc="Total attempts" icon={BookOpen} />
        <DashboardCard title="Average Score" value={avgScore} desc="Overall band" icon={TrendingUp} />
        <DashboardCard title="Best Score" value={bestScore} desc="Highest overall band" icon={Award} />
      </div>

      {/* Attempt History */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">Loading your exam history...</div>
      ) : completed.length > 0 ? (
        <div className="space-y-4">
          {completed.map((attempt) => (
            <div key={attempt.id} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{attempt.practiceSet.title}</h3>
                  <p className="text-sm text-slate-500">
                    {attempt.examType.name} · Submitted: {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-700">{attempt.score?.overall}</p>
                  <p className="text-xs text-slate-400">Overall Band</p>
                </div>
              </div>
              {attempt.score && (
                <div className="grid grid-cols-4 gap-2">
                  <div className="rounded border p-2 text-center"><p className="text-xs text-slate-400">Listening</p><p className="font-bold">{attempt.score.listening}</p></div>
                  <div className="rounded border p-2 text-center"><p className="text-xs text-slate-400">Reading</p><p className="font-bold">{attempt.score.reading}</p></div>
                  <div className="rounded border p-2 text-center"><p className="text-xs text-slate-400">Writing</p><p className="font-bold">{attempt.score.writing}</p></div>
                  <div className="rounded border p-2 text-center"><p className="text-xs text-slate-400">Speaking</p><p className="font-bold">{attempt.score.speaking}</p></div>
                </div>
              )}
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                <span>Confidence: {attempt.score ? Math.round(attempt.score.confidence * 100) : 0}%</span>
                <span>·</span>
                <span>Provider: {attempt.score?.providerUsed || "—"}</span>
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
