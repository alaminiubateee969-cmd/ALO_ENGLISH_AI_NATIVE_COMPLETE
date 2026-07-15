import Link from "next/link";

type ExamType = {
  id: string;
  code: string;
  name: string;
  slug: string;
  description?: string | null;
  duration: number;
  scoreScale: string;
  styleLabel: string;
  isActive: boolean;
};

async function fetchExams(): Promise<ExamType[]> {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3002";
  try {
    const res = await fetch(`${base}/api/exams`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function ExamsPage() {
  const exams = await fetchExams();

  return (
    <main className="bg-alo-soft-gray min-h-screen">
      <section className="bg-alo-navy text-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h1 className="text-3xl font-bold md:text-4xl">Exam types</h1>
          <p className="mt-3 max-w-2xl text-blue-100">
            We prepare students for every major English proficiency test.
            Select an exam to view sections, take a mock test, and access
            AI-graded feedback.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        {exams.length === 0 ? (
          <div className="rounded-xl border border-dashed border-alo-card bg-white p-12 text-center text-alo-muted">
            Exam types will appear here once configured.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((e) => (
              <Link
                key={e.id}
                href={`/exams/${e.id}`}
                className="group flex flex-col rounded-2xl border border-alo-card bg-white p-6 shadow-alo transition hover:-translate-y-0.5 hover:border-alo-blue hover:shadow-alo-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-md bg-alo-soft-blue px-2.5 py-1 font-mono text-xs font-semibold text-alo-blue">
                    {e.code}
                  </span>
                  <span className="text-xs text-alo-faint">{e.duration} min</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-alo-navy group-hover:text-alo-blue">
                  {e.name}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-alo-muted">
                  {e.description || e.styleLabel}
                </p>
                <div className="mt-auto pt-4 text-xs text-alo-faint">
                  Score scale: <span className="text-alo-navy">{e.scoreScale}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
