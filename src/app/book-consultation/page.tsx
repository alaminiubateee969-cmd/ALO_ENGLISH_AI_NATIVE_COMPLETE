import type { Metadata } from "next";
import { LeadCaptureForm } from "@/components/site/lead-capture-form";

export const metadata: Metadata = {
  title: "Book a Study-Abroad Consultation",
  description: "Request a consultation about destinations, courses, budgets or English-test preparation. A counsellor replies during office hours.",
};

type SearchParams = Record<string, string | string[] | undefined>;

const COURSE_PREFERENCES = {
  subject: ["Business & Management", "Computer Science", "Engineering", "Medicine & Health", "Law", "Arts & Humanities", "Education", "Other"],
  level: ["Bachelor", "Master", "PhD", "Diploma or certificate", "Other"],
  country: ["United Kingdom", "Canada", "Australia", "United States", "Ireland", "New Zealand", "United Arab Emirates", "Other"],
  intake: ["January–March", "April–June", "July–September", "October–December", "Flexible / not sure"],
} as const;

function getAllowedValue(value: string | string[] | undefined, allowed: readonly string[]) {
  return typeof value === "string" && allowed.includes(value) ? value : "";
}

export default async function BookConsultationPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const preferences = [
    ["Subject area", getAllowedValue(params.subject, COURSE_PREFERENCES.subject)],
    ["Study level", getAllowedValue(params.level, COURSE_PREFERENCES.level)],
    ["Preferred destination", getAllowedValue(params.country, COURSE_PREFERENCES.country)],
    ["Intake window", getAllowedValue(params.intake, COURSE_PREFERENCES.intake)],
  ].filter(([, value]) => value);
  const initialMessageParts: string[] = [];
  if (preferences.length) {
    initialMessageParts.push(
      `Course-planning preferences from the ALO Course Finder:\n${preferences.map(([label, value]) => `${label}: ${value}`).join("\n")}`,
    );
  }
  if (params.interest === "funding") {
    initialMessageParts.push("Funding interest: I would like to discuss how to identify and verify possible scholarships or other funding options.");
  }
  const initialMessage = initialMessageParts.join("\n\n");
  const selectedCountry = getAllowedValue(params.country, COURSE_PREFERENCES.country);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="mb-3 text-4xl font-bold">Book a Consultation</h1>
        <p className="text-lg text-slate-600">Tell us about your study abroad plans and we will follow up.</p>
      </div>
      <section aria-labelledby="consultation-form-title" className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 id="consultation-form-title" className="mb-1 text-xl font-bold">Request a consultation</h2>
        <p className="mb-5 text-sm text-slate-600">Review any prefilled planning notes, add your contact details, and optionally suggest a consultation date. We will confirm availability with you.</p>
        <LeadCaptureForm
          variant="consultation"
          initialValues={{
            country: selectedCountry,
            message: initialMessage,
          }}
        />
      </section>
    </div>
  );
}
