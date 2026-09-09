"use client";

import { DashboardShell, DashboardCard, DashboardTable, useApi } from "@/components/site/dashboard-shell";
import { FileText, MessageSquare, Calendar, BookOpen, GraduationCap, Award, TrendingUp } from "lucide-react";


const NAV = [
  { label: "Dashboard", href: "/student/dashboard" },
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
      score: { overall: number; confidence: number; providerUsed: string } | null;
    }>;
    pagination: { total: number };
  }>("/api/attempts?limit=5");

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Welcome to your dashboard</h2>
        <p className="text-slate-600">Manage your applications, documents, and practice tests.</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <a href="/course-finder" className="flex items-center gap-2 rounded-lg border p-4 hover:bg-slate-50">
            <BookOpen className="h-5 w-5 text-blue-600" /> Find a Course
          </a>
          <a href="/scholarships" className="flex items-center gap-2 rounded-lg border p-4 hover:bg-slate-50">
            <Award className="h-5 w-5 text-blue-600" /> Search Scholarships
          </a>
          <a href="/book-consultation" className="flex items-center gap-2 rounded-lg border p-4 hover:bg-slate-50">
            <Calendar className="h-5 w-5 text-blue-600" /> Book Appointment
          </a>
          <a href="/practice-test" className="flex items-center gap-2 rounded-lg border p-4 hover:bg-slate-50">
            <GraduationCap className="h-5 w-5 text-blue-600" /> Take a Practice Test
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
            headers={["Exam", "Status", "Started", "Score", "Confidence", "Provider"]}
            rows={attemptsData.attempts.map((a) => [
              a.examType?.name || "—",
              <span key="s" className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.status === "SUBMITTED" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                {a.status}
              </span>,
              new Date(a.startedAt).toLocaleDateString(),
              a.score ? <strong key="sc">{a.score.overall}</strong> : "—",
              a.score ? `${Math.round(a.score.confidence * 100)}%` : "—",
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
