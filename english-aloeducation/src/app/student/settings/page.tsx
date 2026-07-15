"use client";

import { useEffect, useState } from "react";

import { Card, PortalShell, STUDENT_NAV } from "@/components/portal/PortalShell";

type Profile = {
  name: string;
  email: string;
  phone: string;
  targetCountry: string;
  targetCourse: string;
  targetScore: string;
  currentLevel: string;
};

export default function StudentSettingsPage() {
  const [profile, setProfile] = useState<Profile>({
    name: "",
    email: "",
    phone: "",
    targetCountry: "",
    targetCourse: "",
    targetScore: "",
    currentLevel: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load session to prefill name + email.
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => {
        if (s?.user) {
          setProfile((p) => ({ ...p, name: s.user.name ?? "", email: s.user.email ?? "" }));
        }
      })
      .catch(() => {});
  }, []);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    // In production this would POST to /api/students/me.
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setMessage("Profile saved successfully.");
  }

  return (
    <PortalShell
      role="student"
      roleLabel="Student"
      navItems={STUDENT_NAV}
      activePath="/student/settings"
      title="Profile settings"
      subtitle="Update your personal information and learning goals"
      userName={profile.name}
    >
      <Card>
        {message && (
          <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name" value={profile.name} onChange={(v) => update("name", v)} />
            <Field label="Email" value={profile.email} onChange={(v) => update("email", v)} type="email" />
            <Field label="Phone" value={profile.phone} onChange={(v) => update("phone", v)} type="tel" />
            <Field label="Target country" value={profile.targetCountry} onChange={(v) => update("targetCountry", v)} />
            <Field label="Target course / program" value={profile.targetCourse} onChange={(v) => update("targetCourse", v)} />
            <Field label="Target score (e.g. 7.5)" value={profile.targetScore} onChange={(v) => update("targetScore", v)} />
            <Field label="Current English level" value={profile.currentLevel} onChange={(v) => update("currentLevel", v)} />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-alo-blue px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </Card>

      <Card title="Password" className="mt-6">
        <p className="text-sm text-alo-muted">
          To change your password, please contact support at{" "}
          <a href="mailto:support@aloeducation.com" className="text-alo-blue hover:underline">
            support@aloeducation.com
          </a>
          .
        </p>
      </Card>
    </PortalShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-alo-navy">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-alo-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-alo-blue"
      />
    </div>
  );
}
