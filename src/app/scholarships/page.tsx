import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Scholarships", description: "Find scholarships for studying abroad." };

export default function ScholarshipsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Scholarships</h1>
        <p className="text-lg text-slate-600">Discover funding opportunities for your international education.</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Scholarship Database Loading</h2>
        <p className="text-slate-500 mb-4">Verified scholarship information is being compiled from official university and government sources.</p>
        <Link href="/book-consultation" className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">Talk to a Counselor</Link>
      </div>
    </div>
  );
}
