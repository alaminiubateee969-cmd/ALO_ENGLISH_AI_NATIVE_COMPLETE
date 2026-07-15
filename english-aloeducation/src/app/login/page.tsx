"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/student/dashboard";
  const accessDenied = searchParams.get("error") === "AccessDenied";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (res?.error) {
      setError("Invalid email or password. Please try again.");
      return;
    }

    // Fetch the session to learn the role, then route accordingly.
    try {
      const r = await fetch("/api/auth/session");
      const session = await r.json();
      const role = session?.user?.role ?? "STUDENT";
      const target =
        role === "SUPER_ADMIN" || role === "ADMIN"
          ? "/admin/dashboard"
          : role === "TEACHER"
            ? "/teacher/dashboard"
            : role === "EXAMINER"
              ? "/examiner/dashboard"
              : role === "AMBASSADOR"
                ? "/ambassador/dashboard"
                : role === "EMPLOYEE"
                  ? "/employee/dashboard"
                  : from;
      router.push(target);
      router.refresh();
    } catch {
      router.push(from);
      router.refresh();
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-alo-soft-gray px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-alo-card bg-white p-8 shadow-alo-lg">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-alo-navy">Welcome back</h1>
            <p className="mt-1 text-sm text-alo-muted">
              Sign in to continue to your dashboard
            </p>
          </div>

          {accessDenied && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              You don&apos;t have permission to access that page.
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-alo-navy">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-alo-card bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-alo-blue"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-alo-navy">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-alo-card bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-alo-blue"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-alo-blue px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-alo-muted">
            New to ALO English?{" "}
            <Link href="/register" className="font-medium text-alo-blue hover:underline">
              Create an account
            </Link>
          </p>
        </div>
        <p className="mt-4 text-center text-xs text-alo-faint">
          By signing in you agree to the ALO English Education terms & privacy policy.
        </p>
      </div>
    </main>
  );
}
