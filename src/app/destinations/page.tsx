import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Study Destinations",
  description: "Explore destinations and find links to official government study or student-visa guidance.",
};

const DESTINATIONS = [
  { country: "United Kingdom", code: "uk", flag: "🇬🇧", officialUrl: "https://www.gov.uk/student-visa", sourceLabel: "UK government student visa guidance" },
  { country: "Canada", code: "ca", flag: "🇨🇦", officialUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada.html", sourceLabel: "Government of Canada: Study in Canada" },
  { country: "Australia", code: "au", flag: "🇦🇺", officialUrl: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500", sourceLabel: "Australian Government: Student visa" },
  { country: "United States", code: "us", flag: "🇺🇸", officialUrl: "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html", sourceLabel: "U.S. Department of State: Student visas" },
  { country: "Ireland", code: "ie", flag: "🇮🇪", officialUrl: "https://www.irishimmigration.ie/coming-to-study-in-ireland/", sourceLabel: "Irish Immigration: Studying in Ireland" },
  { country: "New Zealand", code: "nz", flag: "🇳🇿", officialUrl: "https://www.immigration.govt.nz/new-zealand-visas/visas/visa/student-visa", sourceLabel: "Immigration New Zealand: Student visa" },
  { country: "United Arab Emirates", code: "ae", flag: "🇦🇪", officialUrl: "https://u.ae/en/information-and-services/education/higher-education/studying-in-the-uae", sourceLabel: "UAE Government: Studying in the UAE" },
];

export default function DestinationsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1F3A]">
      <section className="bg-[#0B1F3A] px-4 py-14 text-white sm:px-6 sm:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#72B7FF]">Explore your options</p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Study destinations</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Start with official government study or visa information, then compare university entry requirements, tuition, living costs, and support options for your own circumstances.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14" aria-labelledby="destination-list-title">
        <div className="mb-6 flex items-center gap-2">
          <MapPin className="size-5 text-[#0057B8]" aria-hidden="true" />
          <h2 id="destination-list-title" className="text-xl font-bold">Official destination resources</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DESTINATIONS.map((destination) => (
            <article key={destination.code} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-4xl" aria-hidden="true">{destination.flag}</span>
                <h3 className="text-xl font-bold">{destination.country}</h3>
              </div>
              <p className="mb-5 flex-1 text-sm leading-6 text-slate-600">
                Use official guidance to check current visa requirements and identify questions to confirm with your chosen institution.
              </p>
              <a
                href={destination.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-between gap-3 rounded-xl border border-[#0057B8]/30 bg-[#F3F8FE] px-4 py-3 text-sm font-semibold text-[#0057B8] hover:bg-[#EAF3FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2"
              >
                <span>{destination.sourceLabel}</span>
                <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          Visa rules, work rights, fees, processing times, and university admissions policies can change. These links are starting points—not immigration or legal advice—and do not guarantee admission, funding, or a visa outcome. Check the relevant official authorities before making decisions.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6" aria-label="Study planning actions">
        <div className="flex flex-col gap-4 rounded-2xl bg-[#EAF3FC] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-bold">Ready to organise your preferences?</h2>
            <p className="mt-1 text-sm text-slate-600">Build a course-planning brief to discuss with ALO Education.</p>
          </div>
          <Link href="/course-finder" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#0057B8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004894] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2 sm:self-auto">
            Open course planner <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
