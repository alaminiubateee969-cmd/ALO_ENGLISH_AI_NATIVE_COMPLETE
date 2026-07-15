import Link from "next/link";
import { notFound } from "next/navigation";

type ExamSection = {
  id: string;
  name: string;
  description?: string | null;
  duration: number;
  sortOrder: number;
};

type ExamType = {
  id: string;
  code: string;
  name: string;
  slug: string;
  description?: string | null;
  duration: number;
  scoreScale: string;
  styleLabel: string;
  sections: ExamSection[];
};

async function fetchExam(id: string): Promise<ExamType | null> {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3002";
  try {
    const res = await fetch(`${base}/api/exams?includeSections=true`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const all: ExamType[] = json.data ?? [];
    return all.find((e) => e.id === id) ?? null;
  } catch {
    return null;
  }
}

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exam = await fetchExam(id);
  if (!exam) notFound();

  return (
    <main className="bg-alo-soft-gray min-h-screen">
      <section className="bg-alo-navy text-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <Link href="/exams" className="text-sm text-blue-200 hover:text-white">
            ← All exam types
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="inline-flex items-center rounded-md bg-white/10 px-2.5 py-1 font-mono text-xs font-semibold ring-1 ring-white/20">
              {exam.code}
            </span>
            <span className="text-xs text-blue-200">{exam.styleLabel}</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">{exam.name}</h1>
          <p className="mt-3 max-w-3xl text-blue-100">
            {exam.description || `Full-length ${exam.name} practice test with AI-graded feedback.`}
          </p>
          <div className="mt-6 flex flex-wrap gap-6 text-sm text-blue-100">
            <span>⏱ Total duration: {exam.duration} min</span>
            <span>📊 Score scale: {exam.scoreScale}</span>
            <span>📚 Sections: {exam.sections.length}</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-xl font-semibold text-alo-navy">Test sections</h2>
        {exam.sections.length === 0 ? (
          <p className="mt-3 text-sm text-alo-muted">No sections configured for this exam yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {exam.sections
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-alo-card bg-white p-5 shadow-alo"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-alo-soft-blue text-sm font-semibold text-alo-blue">
                        {i + 1}
                      </span>
                      <h3 className="font-semibold text-alo-navy">{s.name}</h3>
                    </div>
                    {s.description && (
                      <p className="mt-1 pl-11 text-sm text-alo-muted">{s.description}</p>
                    )}
                  </div>
                  <span className="text-sm text-alo-faint">{s.duration} min</span>
                </div>
              ))}
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/mock-tests"
            className="rounded-lg bg-alo-orange px-6 py-3 font-semibold text-white shadow-alo transition hover:bg-orange-600"
          >
            Start a mock test
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-white px-6 py-3 font-semibold text-alo-navy ring-1 ring-alo-card transition hover:bg-alo-soft-blue"
          >
            Create free account
          </Link>
        </div>
      </section>
    </main>
  );
}
