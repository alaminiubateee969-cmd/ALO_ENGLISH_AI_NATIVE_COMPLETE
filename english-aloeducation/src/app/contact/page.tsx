"use client";

import { useState } from "react";

type FormState = {
  name: string;
  email: string;
  phone: string;
  interest: string;
  targetCountry: string;
  notes: string;
};

const EXAM_INTERESTS = [
  "IELTS Academic",
  "IELTS UKVI",
  "PTE Academic",
  "TOEFL iBT",
  "Duolingo English Test",
  "OIETC",
  "Oxford ELLT",
  "Spoken English",
  "Other",
];

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    interest: EXAM_INTERESTS[0],
    targetCountry: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "website_contact" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Submission failed. Please try again.");
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      setSubmitting(false);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-alo-soft-gray px-4">
        <div className="w-full max-w-md rounded-2xl border border-alo-card bg-white p-8 text-center shadow-alo-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl">
            ✅
          </div>
          <h1 className="mt-4 text-2xl font-bold text-alo-navy">Thank you!</h1>
          <p className="mt-2 text-sm text-alo-muted">
            We&apos;ve received your enquiry. An ALO Education counsellor will
            reach out within 24 hours.
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              setForm({ name: "", email: "", phone: "", interest: EXAM_INTERESTS[0], targetCountry: "", notes: "" });
            }}
            className="mt-6 rounded-lg bg-alo-blue px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700"
          >
            Submit another enquiry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-alo-soft-gray min-h-screen">
      <section className="bg-alo-navy text-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h1 className="text-3xl font-bold md:text-4xl">Contact us</h1>
          <p className="mt-3 max-w-2xl text-blue-100">
            Have a question about courses, mock tests, or institutional
            partnerships? Send us a message — we typically respond within one
            business day.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <aside className="space-y-4">
            <div className="rounded-xl border border-alo-card bg-white p-5 shadow-alo">
              <h3 className="text-sm font-semibold text-alo-navy">📍 Head office</h3>
              <p className="mt-1 text-sm text-alo-muted">
                ALO Education<br />
                Banani, Dhaka 1213<br />
                Bangladesh
              </p>
            </div>
            <div className="rounded-xl border border-alo-card bg-white p-5 shadow-alo">
              <h3 className="text-sm font-semibold text-alo-navy">✉️ Email</h3>
              <p className="mt-1 text-sm text-alo-muted">info@aloeducation.com</p>
            </div>
            <div className="rounded-xl border border-alo-card bg-white p-5 shadow-alo">
              <h3 className="text-sm font-semibold text-alo-navy">📞 Phone</h3>
              <p className="mt-1 text-sm text-alo-muted">+880 1700-000000</p>
            </div>
          </aside>

          <div className="md:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-alo-card bg-white p-8 shadow-alo"
            >
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
                  {error}
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-alo-navy">Full name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className="w-full rounded-lg border border-alo-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-alo-blue"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-alo-navy">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="w-full rounded-lg border border-alo-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-alo-blue"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-alo-navy">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="w-full rounded-lg border border-alo-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-alo-blue"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-alo-navy">Interest</label>
                  <select
                    value={form.interest}
                    onChange={(e) => update("interest", e.target.value)}
                    className="w-full rounded-lg border border-alo-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-alo-blue"
                  >
                    {EXAM_INTERESTS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-alo-navy">Target country</label>
                  <input
                    value={form.targetCountry}
                    onChange={(e) => update("targetCountry", e.target.value)}
                    className="w-full rounded-lg border border-alo-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-alo-blue"
                    placeholder="e.g. UK, USA, Canada, Australia"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-alo-navy">Message</label>
                  <textarea
                    rows={5}
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    className="w-full rounded-lg border border-alo-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-alo-blue"
                    placeholder="Tell us about your goals, timeline, and any questions…"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-lg bg-alo-orange px-4 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send enquiry"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
