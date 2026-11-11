import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Student, Partner & Staff Portals",
  description: "Sign in to the ALO Education student, partner, employee or administrator portal to reach your applications, students or CRM workspace.",
};

const PORTALS = [
  { name: "Student Portal", href: "/login", desc: "Access your applications, documents, and messages.", icon: "🎓", color: "bg-blue-600" },
  { name: "Partner Portal", href: "/login", desc: "Manage referred students and track commissions.", icon: "🤝", color: "bg-green-600" },
  { name: "Employee Portal", href: "/login", desc: "Counselor and staff dashboard for CRM.", icon: "💼", color: "bg-purple-600" },
  { name: "Admin Portal", href: "/login", desc: "Platform administration and configuration.", icon: "⚙️", color: "bg-slate-700" },
];

export default function PortalsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Portals</h1>
        <p className="text-lg text-slate-600">Select your portal to login.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {PORTALS.map((p) => (
          <Link key={p.name} href={p.href} className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-lg transition flex items-start gap-4">
            <div className={`rounded-lg ${p.color} p-3 text-white text-2xl`}>{p.icon}</div>
            <div>
              <h2 className="text-lg font-bold mb-1">{p.name}</h2>
              <p className="text-sm text-slate-600">{p.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
