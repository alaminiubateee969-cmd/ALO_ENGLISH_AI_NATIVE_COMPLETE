import Link from "next/link";

type MockTest = {
  id: string;
  mockCode: string;
  title: string;
  description?: string | null;
  difficulty: string;
  duration: number;
  totalQuestions: number;
  isPublished: boolean;
  examType?: { id: string; name: string; code: string };
};

async function fetchMockTests(): Promise<MockTest[]> {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3002";
  // The /api/exams endpoint returns exam types; mock tests are nested
  // inside the database. We expose them through the public listing here.
  try {
    // Fallback: derive mock tests from exam types (showing one placeholder
    // quick test per exam). In production this would be /api/mock-tests.
    const res = await fetch(`${base}/api/exams`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    const exams: Array<{ id: string; name: string; code: string; duration: number }> = json.data ?? [];
    return exams.map((e, i) => ({
      id: `mt-${e.id}`,
      mockCode: `MT-${e.code}-${i + 1}`,
      title: `${e.name} — Full Mock Test`,
      description: `Full-length ${e.name} practice test under exam conditions.`,
      difficulty: i % 2 === 0 ? "MEDIUM" : "HARD",
      duration: e.duration,
      totalQuestions: 40,
      isPublished: true,
      examType: { id: e.id, name: e.name, code: e.code },
    }));
  } catch {
    return [];
  }
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "bg-green-50 text-green-700 ring-green-200",
  MEDIUM: "bg-amber-50 text-amber-700 ring-amber-200",
  HARD: "bg-orange-50 text-orange-700 ring-orange-200",
  ADVANCED: "bg-red-50 text-red-700 ring-red-200",
};

export default async function MockTestsPage() {
  const tests = await fetchMockTests();

  return (
    <main className="bg-alo-soft-gray min-h-screen">
      <section className="bg-alo-navy text-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h1 className="text-3xl font-bold md:text-4xl">Mock tests</h1>
          <p className="mt-3 max-w-2xl text-blue-100">
            Practice with full-length, timed mock tests. Get instant scoring
            for Reading & Listening, and AI-assisted evaluation for Writing &
            Speaking.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        {tests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-alo-card bg-white p-12 text-center text-alo-muted">
            No mock tests published yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tests.map((t) => (
              <div
                key={t.id}
                className="flex flex-col rounded-2xl border border-alo-card bg-white p-6 shadow-alo"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-alo-faint">{t.mockCode}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                      DIFFICULTY_COLORS[t.difficulty] || DIFFICULTY_COLORS.MEDIUM
                    }`}
                  >
                    {t.difficulty}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-alo-navy">{t.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-alo-muted">
                  {t.description}
                </p>
                <div className="mt-auto flex items-center justify-between pt-4 text-sm">
                  <span className="text-alo-faint">
                    {t.totalQuestions} Qs · {t.duration} min
                  </span>
                  <Link
                    href="/register"
                    className="rounded-lg bg-alo-blue px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    Start test
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
