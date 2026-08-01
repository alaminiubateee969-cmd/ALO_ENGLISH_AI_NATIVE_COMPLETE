import type { Metadata } from "next";
import { DashboardShell, DashboardCard } from "@/components/site/dashboard-shell";
export const metadata: Metadata = { title: "Student Dashboard" };

const NAV = [
  { label: "Dashboard", href: "/student/dashboard" },
  { label: "My Applications", href: "/student/dashboard" },
  { label: "Documents", href: "/student/dashboard" },
  { label: "Course Finder", href: "/course-finder" },
  { label: "Scholarships", href: "/scholarships" },
  { label: "Appointments", href: "/student/dashboard" },
  { label: "Messages", href: "/student/dashboard" },
  { label: "Mock Tests", href: "/student/dashboard" },
  { label: "Settings", href: "/student/dashboard" },
];

export default function StudentDashboard() {
  return (
    <DashboardShell title="Student Portal" nav={NAV} role="STUDENT">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Welcome to your dashboard</h2>
        <p className="text-slate-600">Manage your applications, documents, and communications.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <DashboardCard title="Applications" value={0} desc="Track your applications" />
        <DashboardCard title="Documents" value={0} desc="Uploaded documents" />
        <DashboardCard title="Messages" value={0} desc="Unread messages" />
        <DashboardCard title="Appointments" value={0} desc="Upcoming" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <a href="/course-finder" className="rounded-lg border p-4 hover:bg-slate-50">Find a Course</a>
          <a href="/scholarships" className="rounded-lg border p-4 hover:bg-slate-50">Search Scholarships</a>
          <a href="/book-consultation" className="rounded-lg border p-4 hover:bg-slate-50">Book Appointment</a>
          <a href="/language-prep" className="rounded-lg border p-4 hover:bg-slate-50">Practice Tests</a>
        </div>
      </div>
    </DashboardShell>
  );
}
