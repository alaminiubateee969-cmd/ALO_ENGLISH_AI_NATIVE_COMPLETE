"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, role: "STUDENT" }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Registration failed. Please try again.");
        setSubmitting(false);
        return;
      }

      // Auto sign-in after successful registration.
      const signRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setSubmitting(false);

      if (signRes?.error) {
        // Account was created but auto-login failed — send to login.
        router.push("/login?registered=1");
        return;
      }

      router.push("/student/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-alo-soft-gray px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-alo-card bg-white p-8 shadow-alo-lg">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-alo-navy">Create your account</h1>
            <p className="mt-1 text-sm text-alo-muted">
              Start learning English with ALO today
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-alo-navy">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-alo-card bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-alo-blue"
                placeholder="Jane Doe"
              />
            </div>
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
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-alo-navy">
                Phone <span className="text-alo-faint">(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-alo-card bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-alo-blue"
                placeholder="+8801XXXXXXXXX"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-alo-navy">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-alo-card bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-alo-blue"
                placeholder="At least 8 characters"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-alo-orange px-4 py-2.5 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
            >
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-alo-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-alo-blue hover:underline">
              Sign in
            </Link>
          </p>
        </div>
        <p className="mt-4 text-center text-xs text-alo-faint">
          Free accounts include 1 complimentary mock test. ALO Education students get 3.
        </p>
      </div>
    </main>
  );
}
