import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Universities", description: "Browse universities across popular study destinations." };

export default function UniversitiesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Universities</h1>
        <p className="text-lg text-slate-600">Explore partner and popular universities worldwide.</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-12 text-center">
        <h2 className="text-xl font-semibold mb-2">University Database Loading</h2>
        <p className="text-slate-500 mb-4">Our university database is being populated with verified information from official sources.</p>
        <Link href="/book-consultation" className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">Get Personalized Recommendations</Link>
      </div>
    </div>
  );
}
