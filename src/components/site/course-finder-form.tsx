"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

const SUBJECTS = [
  "Business & Management",
  "Computer Science",
  "Engineering",
  "Medicine & Health",
  "Law",
  "Arts & Humanities",
  "Education",
  "Other",
] as const;

const LEVELS = ["Bachelor", "Master", "PhD", "Diploma or certificate", "Other"] as const;
const DESTINATIONS = ["United Kingdom", "Canada", "Australia", "United States", "Ireland", "New Zealand", "United Arab Emirates", "Other"] as const;
const INTAKES = ["January–March", "April–June", "July–September", "October–December", "Flexible / not sure"] as const;

const FIELD_CLASS = "h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-[#0B1F3A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8]";

export function CourseFinderForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [country, setCountry] = useState("");
  const [intake, setIntake] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams({ source: "course-finder" });
    if (subject) params.set("subject", subject);
    if (level) params.set("level", level);
    if (country) params.set("country", country);
    if (intake) params.set("intake", intake);
    router.push(`/book-consultation?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="course-subject" className="mb-1.5 block text-sm font-semibold text-[#0B1F3A]">Subject area</label>
          <select id="course-subject" value={subject} onChange={(event) => setSubject(event.target.value)} className={FIELD_CLASS}>
            <option value="">Choose a subject</option>
            {SUBJECTS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="course-level" className="mb-1.5 block text-sm font-semibold text-[#0B1F3A]">Study level</label>
          <select id="course-level" value={level} onChange={(event) => setLevel(event.target.value)} className={FIELD_CLASS}>
            <option value="">Choose a level</option>
            {LEVELS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="course-country" className="mb-1.5 block text-sm font-semibold text-[#0B1F3A]">Preferred destination</label>
          <select id="course-country" value={country} onChange={(event) => setCountry(event.target.value)} className={FIELD_CLASS}>
            <option value="">Choose a destination</option>
            {DESTINATIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="course-intake" className="mb-1.5 block text-sm font-semibold text-[#0B1F3A]">Intake window</label>
          <select id="course-intake" value={intake} onChange={(event) => setIntake(event.target.value)} className={FIELD_CLASS}>
            <option value="">Choose a window</option>
            {INTAKES.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-xs leading-5 text-slate-500">
          This planner does not search a verified live university database or predict admission outcomes. It carries your preferences into a consultation request for follow-up.
        </p>
        <button
          type="submit"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#CC3F10] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#A8320D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8501A] focus-visible:ring-offset-2"
        >
          <Search className="size-4" aria-hidden="true" />
          Build my planning brief
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
