"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Menu, X, FileText, MessageSquare, Calendar, BookOpen, GraduationCap, Award } from "lucide-react";

type NavItem = { label: string; href: string };

export function DashboardShell({
  title,
  nav,
  role,
  roles,
  children,
}: {
  title: string;
  nav: NavItem[];
  /** A single permitted role. Prefer `roles` when more than one may open the screen. */
  role?: string;
  /**
   * Every role that may open this screen. Needed because the CRM's permissions
   * are not a hierarchy: a counsellor and a super admin both resolve review
   * entries, and an exact-match check on one role would lock one of them out.
   */
  roles?: string[];
  children: React.ReactNode;
}) {
  const allowedRoles = roles ?? (role ? [role] : []);
  const allowedLabel = allowedRoles.join(", ");
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          router.replace("/login");
          return;
        }
        if (allowedRoles.length > 0 && !allowedRoles.includes(data.data.user.role)) {
          setAccessDenied(true);
          return;
        }
        setUser(data.data.user);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
    // The dependency is the joined label rather than the array: a fresh array
    // literal on every render would re-run this check in a loop.
  }, [router, allowedRoles.length, allowedLabel]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Access denied</h1>
          <p className="mt-2 text-sm text-slate-600">This dashboard is restricted to {allowedLabel} accounts.</p>
          <Link href="/" className="mt-4 inline-flex min-h-11 items-center font-medium text-blue-700 underline underline-offset-2">
            Return to the home page
          </Link>
        </div>
      </main>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b bg-white">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button className="lg:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="font-bold text-lg">{title}</h1>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{role}</span>
            <span className="hidden sm:inline text-sm text-slate-500">{user.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </header>
      <div className="flex">
        <aside className={`fixed lg:sticky top-16 z-30 h-[calc(100vh-4rem)] w-64 border-r bg-white overflow-y-auto transition-transform ${menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          <nav className="p-4 space-y-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        {menuOpen && <div className="fixed inset-0 top-16 z-20 bg-black/30 lg:hidden" onClick={() => setMenuOpen(false)} />}
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function DashboardCard({ title, value, desc, icon: Icon }: { title: string; value: string | number; desc?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {Icon && <Icon className="h-5 w-5 text-slate-400" />}
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {desc && <p className="mt-1 text-xs text-slate-400">{desc}</p>}
    </div>
  );
}

export function DashboardTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b bg-slate-50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-left font-semibold text-slate-700">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-slate-400">No records found</td></tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="border-b last:border-0">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-slate-600">{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Hook to fetch data from an API endpoint */
export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
        else setError(d.message || "Failed to load");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}
