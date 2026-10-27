"use client";

import { DashboardShell, DashboardCard, DashboardTable, useApi } from "@/components/site/dashboard-shell";
import { FileText, MessageSquare, Calendar, BookOpen, GraduationCap, Award, TrendingUp, Mic } from "lucide-react";


const NAV = [
  { label: "Dashboard", href: "/student/dashboard" },
  { label: "Study Materials", href: "/student/materials" },
  { label: "Speaking conversation practice", href: "/live-exam" },
  { label: "Course Finder", href: "/course-finder" },
  { label: "Scholarships", href: "/scholarships" },
  { label: "Practice Tests", href: "/practice-test" },
  { label: "Language Prep", href: "/language-prep" },
  { label: "Book Consultation", href: "/book-consultation" },
  { label: "Contact", href: "/contact" },
  { label: "Logout", href: "/login" },
];

function StudentDashboardContent() {
  const { data: attemptsData, loading: attemptsLoading } = useApi<{
    attempts: Array<{
      id: string;
      status: string;
      startedAt: string;
      examType: { code: string; name: string };
      score: { overall: number; confidence: null; confidenceCalibrated: false; providerUsed: string; isOfficialScore: false } | null;
    }>;
    pagination: { total: number };
  }>("/api/attempts?limit=5");

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Welcome to your dashboard</h2>
        <p className="text-slate-600">Manage your applications, documents, and practice tests.</p>
      </div>

      {/* Live AI Examiner Banner */}
      <div className="mb-6 overflow-hidden rounded-xl border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-amber-50 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
              <Mic className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Speaking Conversation Practice</h3>
              <p className="text-sm text-slate-600">
                Speak with a conversational practice agent. Audio is sent to the configured speech-recognition service for transcription; this page does not save a test attempt, produce an exam score, or measure pronunciation acoustically.
              </p>
            </div>
          </div>
          <a
            href="/live-exam"
            className="shrink-0 rounded-lg bg-rose-500 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-md transition hover:bg-rose-600"
          >
            Start conversation practice →
          </a>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <a href="/live-exam" className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 hover:bg-rose-100">
            <Mic className="h-5 w-5 text-rose-600" /> Speaking Conversation Practice
          </a>
          <a href="/course-finder" className="flex items-center gap-2 rounded-lg border p-4 hover:bg-slate-50">
            <BookOpen className="h-5 w-5 text-blue-600" /> Find a Course
          </a>
          <a href="/scholarships" className="flex items-center gap-2 rounded-lg border p-4 hover:bg-slate-50">
            <Award className="h-5 w-5 text-blue-600" /> Search Scholarships
          </a>
          <a href="/student/materials" className="flex items-center gap-2 rounded-lg border p-4 hover:bg-slate-50">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            <div>
              <div className="font-semibold">Study Materials</div>
              <div className="text-xs text-slate-500">Free guides for every exam — grammar, vocabulary, strategies.</div>
            </div>
          </a>
          <a href="/practice-test" className="flex items-center gap-2 rounded-lg border p-4 hover:bg-slate-50">
            <GraduationCap className="h-5 w-5 text-blue-600" /> Practice Test (Written)
          </a>
        </div>
      </div>

      {/* Exam Attempts — REAL DATA */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" /> My Practice Test Results
        </h3>
        {attemptsLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            Loading your test results...
          </div>
        ) : attemptsData && attemptsData.attempts && attemptsData.attempts.length > 0 ? (
          <DashboardTable
            headers={["Exam", "Status", "Started", "Practice indicator", "Calibration", "Method"]}
            rows={attemptsData.attempts.map((a) => [
              a.examType?.name || "—",
              <span key="s" className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.status === "SUBMITTED" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                {a.status}
              </span>,
              new Date(a.startedAt).toLocaleDateString(),
              a.score ? <strong key="sc">{a.score.overall} / 9</strong> : "No numeric result",
              a.score ? "Not validated" : "—",
              a.score?.providerUsed || "—",
            ])}
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-500 mb-2">No practice tests yet.</p>
            <a href="/language-prep" className="text-blue-600 font-semibold hover:underline">
              Start your first practice test →
            </a>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          title="Total Practice Tests"
          value={attemptsData?.pagination?.total ?? 0}
          desc="Tests you've taken"
          icon={FileText}
        />
        <DashboardCard
          title="Messages"
          value={0}
          desc="Check /api/crm/messages"
          icon={MessageSquare}
        />
        <DashboardCard
          title="Appointments"
          value={0}
          desc="Book a consultation"
          icon={Calendar}
        />
      </div>
    </>
  );
}

export default function StudentDashboard() {
  return (
    <DashboardShell title="Student Portal" nav={NAV} role="STUDENT">
      <StudentDashboardContent />
    </DashboardShell>
  );
}
