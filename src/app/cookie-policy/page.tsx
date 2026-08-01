import type { Metadata } from "next";
export const metadata: Metadata = { title: "Cookie Policy" };
export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose prose-slate">
      <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().getFullYear()}</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">1. What Are Cookies</h2>
      <p className="text-slate-700">Cookies are small text files stored on your device when you visit a website.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">2. How We Use Cookies</h2>
      <p className="text-slate-700">We use only essential cookies for authentication and session management. We do not use tracking or advertising cookies.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">3. Managing Cookies</h2>
      <p className="text-slate-700">You can control cookies through your browser settings. Disabling essential cookies will prevent login.</p>
    </div>
  );
}
