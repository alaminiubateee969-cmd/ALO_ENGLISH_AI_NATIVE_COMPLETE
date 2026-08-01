"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function ErrorMsg({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p>;
}

function SuccessMsg({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>;
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Login failed");
        return;
      }
      // Redirect based on role
      const role = data.data?.user?.role;
      if (role === "ADMIN" || role === "SUPER_ADMIN") router.push("/admin/dashboard");
      else if (role === "PARTNER") router.push("/partner/dashboard");
      else if (role === "STUDENT") router.push("/student/dashboard");
      else router.push("/employee/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <ErrorMsg msg={error} />
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
      </div>
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" /> Remember me
        </label>
        <Link href="/forgot-password" className="text-blue-600 hover:underline">Forgot password?</Link>
      </div>
      <button type="submit" disabled={loading} className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Logging in..." : "Login"}
      </button>
      <p className="text-center text-sm text-slate-600">
        Don&apos;t have an account? <Link href="/register" className="text-blue-600 hover:underline">Register</Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Registration failed");
        return;
      }
      router.push("/student/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <ErrorMsg msg={error} />
      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password (min 12 characters)</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required minLength={12} />
      </div>
      <button type="submit" disabled={loading} className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Creating account..." : "Create Account"}
      </button>
      <p className="text-center text-sm text-slate-600">
        Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Request failed");
        return;
      }
      setSuccess("If an account exists, a reset link has been sent to your email.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <ErrorMsg msg={error} />
      <SuccessMsg msg={success} />
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
      </div>
      <button type="submit" disabled={loading} className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Sending..." : "Send Reset Link"}
      </button>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const token = new URLSearchParams(window.location.search).get("token") || "";
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Reset failed");
        return;
      }
      router.push("/login");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <ErrorMsg msg={error} />
      <div>
        <label className="block text-sm font-medium mb-1">New Password (min 12 characters)</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required minLength={12} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Confirm Password</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required minLength={12} />
      </div>
      <button type="submit" disabled={loading} className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
}
