"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FormVariant = "contact" | "consultation";
type FormValues = {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  preferredDate: string;
  message: string;
};
type Feedback = { kind: "success" | "error"; message: string };

const EMPTY_FORM: FormValues = {
  name: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "",
  preferredDate: "",
  message: "",
};

export function LeadCaptureForm({
  variant,
  initialValues,
}: {
  variant: FormVariant;
  initialValues?: Partial<Pick<FormValues, "country" | "message">>;
}) {
  const consultation = variant === "consultation";
  const prefix = consultation ? "consultation" : "contact";
  const [form, setForm] = useState<FormValues>(() => ({ ...EMPTY_FORM, ...initialValues }));
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const name = consultation
      ? `${form.firstName.trim()} ${form.lastName.trim()}`.trim()
      : form.name.trim();
    const message = [
      form.message.trim(),
      consultation && form.preferredDate
        ? `Preferred consultation date: ${form.preferredDate}`
        : "",
    ].filter(Boolean).join("\n\n");

    try {
      const referralCode = new URLSearchParams(window.location.search).get("ref") || undefined;
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          country: form.country || undefined,
          message: message || undefined,
          source: `${prefix}-page`,
          referralCode,
        }),
      });
      const payload = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || !payload.success) {
        setFeedback({ kind: "error", message: payload.message || "We could not send your request. Please try again." });
        return;
      }

      setForm(EMPTY_FORM);
      setFeedback({
        kind: "success",
        message: consultation
          ? "Your consultation request was received. Our team will follow up using the details you provided."
          : "Your message was received. Our team will follow up using the details you provided.",
      });
    } catch {
      setFeedback({ kind: "error", message: "Network error. Your request was not submitted; please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass = "h-11 rounded-lg border-slate-300 focus-visible:ring-blue-600";

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label={consultation ? "Consultation request form" : "Contact form"}>
      {consultation ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${prefix}-first-name`} className="mb-1 block text-sm font-medium">First name</label>
            <Input id={`${prefix}-first-name`} autoComplete="given-name" value={form.firstName} onChange={(event) => update("firstName", event.target.value)} maxLength={50} className={fieldClass} required />
          </div>
          <div>
            <label htmlFor={`${prefix}-last-name`} className="mb-1 block text-sm font-medium">Last name</label>
            <Input id={`${prefix}-last-name`} autoComplete="family-name" value={form.lastName} onChange={(event) => update("lastName", event.target.value)} maxLength={50} className={fieldClass} required />
          </div>
        </div>
      ) : (
        <div>
          <label htmlFor={`${prefix}-name`} className="mb-1 block text-sm font-medium">Name</label>
          <Input id={`${prefix}-name`} autoComplete="name" value={form.name} onChange={(event) => update("name", event.target.value)} maxLength={100} className={fieldClass} required />
        </div>
      )}

      <div>
        <label htmlFor={`${prefix}-email`} className="mb-1 block text-sm font-medium">Email</label>
        <Input id={`${prefix}-email`} type="email" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} maxLength={254} className={fieldClass} required />
      </div>

      <div>
        <label htmlFor={`${prefix}-phone`} className="mb-1 block text-sm font-medium">Phone{consultation ? "" : " (optional)"}</label>
        <Input id={`${prefix}-phone`} type="tel" autoComplete="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} maxLength={30} className={fieldClass} required={consultation} />
      </div>

      {consultation && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${prefix}-country`} className="mb-1 block text-sm font-medium">Preferred country</label>
            <select id={`${prefix}-country`} value={form.country} onChange={(event) => update("country", event.target.value)} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
              <option value="">Select a country</option>
              {["United Kingdom", "Canada", "Australia", "United States", "Ireland", "New Zealand", "United Arab Emirates", "Other"].map((country) => <option key={country} value={country}>{country}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${prefix}-date`} className="mb-1 block text-sm font-medium">Preferred date</label>
            <Input id={`${prefix}-date`} type="date" value={form.preferredDate} onChange={(event) => update("preferredDate", event.target.value)} className={fieldClass} />
          </div>
        </div>
      )}

      <div>
        <label htmlFor={`${prefix}-message`} className="mb-1 block text-sm font-medium">Message{consultation ? " (optional)" : ""}</label>
        <Textarea id={`${prefix}-message`} rows={consultation ? 3 : 4} value={form.message} onChange={(event) => update("message", event.target.value)} maxLength={2000} className="min-h-24 border-slate-300 focus-visible:ring-blue-600" required={!consultation} />
      </div>

      <Button type="submit" disabled={submitting} className="min-h-11 w-full rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600">
        {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        {submitting ? "Sending…" : consultation ? "Request consultation" : "Send message"}
      </Button>

      <p className="text-xs text-slate-500">
        Your request is sent to ALO Education for follow-up. See our <a href="/privacy-policy" className="font-medium text-blue-700 underline underline-offset-2">privacy policy</a>.
      </p>
      {feedback && (
        <p role={feedback.kind === "error" ? "alert" : "status"} aria-live="polite" className={`rounded-lg border p-3 text-sm ${feedback.kind === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {feedback.message}
        </p>
      )}
    </form>
  );
}
