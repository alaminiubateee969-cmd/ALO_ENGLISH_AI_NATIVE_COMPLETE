import Link from "next/link";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon?: string;
};

/**
 * Shared shell for authenticated portal pages (student / admin / teacher /
 * examiner / ambassador / employee). Renders the role-coloured sidebar,
 * a top bar with the page title, and the page body.
 *
 * Used by all portal pages to keep layout consistent and avoid duplication.
 */
export function PortalShell({
  role,
  roleLabel,
  navItems,
  title,
  subtitle,
  userName,
  activePath,
  children,
}: {
  role: "student" | "admin" | "teacher" | "examiner" | "ambassador" | "employee";
  roleLabel: string;
  navItems: NavItem[];
  title: string;
  subtitle?: string;
  userName?: string | null;
  activePath: string;
  children: React.ReactNode;
}) {
  const roleColor: Record<typeof role, string> = {
    student: "bg-alo-blue",
    admin: "bg-alo-navy",
    teacher: "bg-emerald-700",
    examiner: "bg-purple-700",
    ambassador: "bg-alo-orange",
    employee: "bg-slate-700",
  };

  return (
    <div className="flex min-h-screen bg-alo-soft-gray">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-alo-navy text-white md:flex">
        <div className="border-b border-white/10 px-6 py-5">
          <Link href="/" className="block text-lg font-bold">
            ALO<span className="text-alo-orange">English</span>
          </Link>
          <p className="mt-0.5 text-xs text-blue-200">{roleLabel} portal</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = activePath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                  active
                    ? "bg-white/10 font-semibold text-white"
                    : "text-blue-100 hover:bg-white/5 hover:text-white",
                )}
              >
                {item.icon && <span className="text-base">{item.icon}</span>}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-6 py-4 text-xs text-blue-200">
          <p className="font-medium text-white">{userName ?? "Signed in"}</p>
          <Link href="/api/auth/signout" className="mt-1 inline-block hover:text-white">
            Sign out →
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className={cn("px-6 py-6 text-white", roleColor[role])}>
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-white/80">{subtitle}</p>}
            </div>
            <div className="hidden text-right text-xs sm:block">
              <p className="font-semibold text-white">{userName ?? "User"}</p>
              <p className="text-white/70">{roleLabel}</p>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}

/**
 * Lightweight card primitive used across portal pages.
 */
export function Card({
  title,
  children,
  action,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-alo-card bg-white p-6 shadow-alo", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="font-semibold text-alo-navy">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * KPI / metric tile used on dashboards.
 */
export function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "blue" | "orange" | "green" | "navy";
}) {
  const colors: Record<string, string> = {
    blue: "text-alo-blue",
    orange: "text-alo-orange",
    green: "text-emerald-600",
    navy: "text-alo-navy",
  };
  return (
    <div className="rounded-2xl border border-alo-card bg-white p-5 shadow-alo">
      <p className="text-xs uppercase tracking-wide text-alo-faint">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold", accent ? colors[accent] : "text-alo-navy")}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-alo-muted">{hint}</p>}
    </div>
  );
}

/**
 * Empty state placeholder for tables & lists.
 */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-alo-card bg-white p-8 text-center text-sm text-alo-muted">
      {message}
    </div>
  );
}

export const STUDENT_NAV = [
  { href: "/student/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/student/courses", label: "My Courses", icon: "📚" },
  { href: "/student/exams", label: "Exam Attempts", icon: "📝" },
  { href: "/student/certificates", label: "Certificates", icon: "🏆" },
  { href: "/student/assignments", label: "Assignments", icon: "✏️" },
  { href: "/student/payments", label: "Payments", icon: "💳" },
  { href: "/student/messages", label: "Messages", icon: "✉️" },
  { href: "/student/settings", label: "Settings", icon: "⚙️" },
];

export const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/students", label: "Students", icon: "👥" },
  { href: "/admin/courses", label: "Courses", icon: "📚" },
  { href: "/admin/leads", label: "Leads CRM", icon: "🎯" },
  { href: "/admin/payments", label: "Payments", icon: "💳" },
  { href: "/admin/exam-attempts", label: "Exam Attempts", icon: "📝" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export const TEACHER_NAV = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/teacher/classes", label: "My Classes", icon: "🏫" },
  { href: "/teacher/assignments", label: "Assignments", icon: "✏️" },
];

export const EXAMINER_NAV = [
  { href: "/examiner/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/examiner/writing-review", label: "Writing Reviews", icon: "✍️" },
  { href: "/examiner/speaking-review", label: "Speaking Reviews", icon: "🎤" },
];

export const AMBASSADOR_NAV = [
  { href: "/ambassador/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/ambassador/referrals", label: "Referrals", icon: "🤝" },
];

export const EMPLOYEE_NAV = [
  { href: "/employee/dashboard", label: "Dashboard", icon: "🏠" },
];
