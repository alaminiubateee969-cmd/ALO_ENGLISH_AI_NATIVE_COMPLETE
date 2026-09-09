import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Language Preparation", description: "English test preparation: IELTS, PTE, TOEFL, Duolingo." };

const TESTS = [
  { name: "IELTS", desc: "International English Language Testing System", sections: "Listening, Reading, Writing, Speaking", scale: "Band 0-9", duration: "2h 45m" },
  { name: "PTE Academic", desc: "Pearson Test of English Academic", sections: "Speaking & Writing, Reading, Listening", scale: "10-90", duration: "2h 00m" },
  { name: "TOEFL iBT", desc: "Test of English as a Foreign Language", sections: "Reading, Listening, Speaking, Writing", scale: "0-120", duration: "2h 00m" },
  { name: "Duolingo English Test", desc: "Adaptive online English test", sections: "Literacy, Comprehension, Conversation, Production", scale: "10-160", duration: "1h 00m" },
];

export default function LanguagePrepPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Language Preparation</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">Prepare for English proficiency tests with our practice platform and coaching.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {TESTS.map((t) => (
          <div key={t.name} className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold mb-1">{t.name}</h2>
            <p className="text-sm text-slate-500 mb-4">{t.desc}</p>
            <dl className="space-y-2 text-sm">
              <div><dt className="font-semibold text-slate-700 inline">Sections: </dt><dd className="inline text-slate-600">{t.sections}</dd></div>
              <div><dt className="font-semibold text-slate-700 inline">Scoring: </dt><dd className="inline text-slate-600">{t.scale}</dd></div>
              <div><dt className="font-semibold text-slate-700 inline">Duration: </dt><dd className="inline text-slate-600">{t.duration}</dd></div>
            </dl>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <div className="flex flex-col gap-3 sm:flex-row justify-center">
          <Link href="/practice-test" className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Take a Practice Test →
          </Link>
          <Link href="/book-consultation" className="inline-block rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Book a Prep Session
          </Link>
        </div>
      </div>
    </div>
  );
}
