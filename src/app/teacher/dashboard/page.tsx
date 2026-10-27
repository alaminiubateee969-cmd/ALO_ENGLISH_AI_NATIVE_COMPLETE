"use client";

/**
 * /teacher/dashboard — the ALO teacher portal.
 *
 * Teachers guide practice: they see the student roster and how students are
 * performing on mocks (latest attempts + scores), with quick links into the
 * practice surface. Read-only by design — CRM writes stay with counselors and
 * admins. The data comes from the purpose-built /api/teacher/overview.
 */

import { DashboardShell, DashboardCard, DashboardTable, useApi } from "@/components/site/dashboard-shell";
import { Users, BookOpen, GraduationCap, ClipboardCheck, Mic } from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/teacher/dashboard" },
  { label: "AI Teachers", href: "/student/ai-teachers" },
  { label: "Practice Tests", href: "/practice-test" },
  { label: "Speaking practice", href: "/live-exam" },
  { label: "Study materials", href: "/student/materials" },
  { label: "Logout", href: "/login" },
];

type Overview = {
  overview: {
    activeStudents: number;
    teachers: number;
    studyMaterials: number;
    attemptsByStatus: Array<{ status: string; count: number }>;
  };
  students: Array<{
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
    studentProfile: { studentCode: string | null; status: string } | null;
  }>;
  recentAttempts: Array<{
    id: string;
    status: string;
    submittedAt: string | null;
    attemptNumber: number;
    user: { name: string | null; email: string };
    practiceSet: { title: string; examType: { code: string; name: string } };
    score: { overall: number; providerUsed: string } | null;
  }>;
};

function TeacherDashboardContent() {
  const { data, loading, error } = useApi<Overview>("/api/teacher/overview");

  if (loading) return <p className="text-slate-600">Loading your classes…</p>;
  if (error) return <p className="text-rose-600">{error}</p>;
  if (!data) return null;

  const { overview, students, recentAttempts } = data;
  const scored = overview.attemptsByStatus.find((s) => s.status === "SCORED")?.count ?? 0;
  const inProgress = overview.attemptsByStatus.find((s) => s.status === "IN_PROGRESS")?.count ?? 0;

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Teacher portal</h2>
        <p className="text-slate-600">
          Guide your students&apos; practice — every mock, speaking session and study material on the
          platform is free and unlimited for them, 24/7.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Active students" value={String(overview.activeStudents)} icon={Users} />
        <DashboardCard title="Scored attempts" value={String(scored)} icon={ClipboardCheck} />
        <DashboardCard title="In progress" value={String(inProgress)} icon={GraduationCap} />
        <DashboardCard title="Study materials" value={String(overview.studyMaterials)} icon={BookOpen} />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <a href="/practice-test" className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50">
          <ClipboardCheck className="h-5 w-5 text-blue-600" />
          <div>
            <div className="font-semibold">Open the practice-test catalog</div>
            <div className="text-xs text-slate-500">All 32 exams — assign any mock, free for every student.</div>
          </div>
        </a>
        <a href="/live-exam" className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 hover:bg-rose-100">
          <Mic className="h-5 w-5 text-rose-600" />
          <div>
            <div className="font-semibold">AI speaking practice</div>
            <div className="text-xs text-slate-500">Conversation practice students can run 24/7.</div>
          </div>
        </a>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-bold">Recent student results</h3>
        <p className="mb-3 text-sm text-slate-600">
          The latest submitted mocks across every exam — spot who needs help before their real test.
        </p>
        <DashboardTable
          headers={["Student", "Exam", "Practice set", "Attempt", "Score", "Submitted"]}
          rows={recentAttempts.map((a) => [
            a.user.name || a.user.email,
            a.practiceSet.examType.code,
            a.practiceSet.title,
            `#${a.attemptNumber}`,
            a.score ? String(a.score.overall) : "—",
            a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : "—",
          ])}
        />
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-lg font-bold">Student roster</h3>
        <p className="mb-3 text-sm text-slate-600">Newest students first.</p>
        <DashboardTable
          headers={["Name", "Email", "ALO code", "CRM status", "Joined"]}
          rows={students.map((s) => [
            s.name || "—",
            s.email,
            s.studentProfile?.studentCode || "—",
            s.studentProfile?.status || "—",
            new Date(s.createdAt).toLocaleDateString(),
          ])}
        />
      </div>
    </>
  );
}

export default function TeacherDashboardPage() {
  return (
    <DashboardShell title="Teacher Portal" nav={NAV} roles={["TEACHER"]}>
      <TeacherDashboardContent />
    </DashboardShell>
  );
}
