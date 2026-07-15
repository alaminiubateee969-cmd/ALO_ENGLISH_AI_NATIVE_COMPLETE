import Link from "next/link";

import { formatCurrency } from "@/lib/utils";

type Course = {
  id: string;
  courseCode: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  price: number;
  currency: string;
  imageUrl?: string | null;
  _count?: { enrollments: number; classes: number };
};

const CATEGORY_LABELS: Record<string, string> = {
  ielts: "IELTS",
  pte: "PTE",
  toefl: "TOEFL",
  duolingo: "Duolingo",
  oietc: "OIETC",
  spoken: "Spoken English",
  academic: "Academic",
  business: "Business",
  grammar: "Grammar",
  vocabulary: "Vocabulary",
};

async function fetchCourses(): Promise<Course[]> {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3002";
  try {
    const res = await fetch(`${base}/api/courses?limit=200`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function CoursesPage() {
  const courses = await fetchCourses();

  return (
    <main className="bg-alo-soft-gray min-h-screen">
      <section className="bg-alo-navy text-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h1 className="text-3xl font-bold md:text-4xl">Course catalog</h1>
          <p className="mt-3 max-w-2xl text-blue-100">
            Browse our full catalog of English courses. Filter by category,
            enroll online, and start learning immediately.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        {courses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-alo-card bg-white p-12 text-center">
            <p className="text-alo-muted">
              No courses are available right now. Please check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/courses/${c.slug}`}
                className="group flex flex-col rounded-2xl border border-alo-card bg-white p-6 shadow-alo transition hover:-translate-y-0.5 hover:border-alo-blue hover:shadow-alo-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-alo-soft-blue px-3 py-1 text-xs font-semibold text-alo-blue">
                    {CATEGORY_LABELS[c.category] ?? c.category.toUpperCase()}
                  </span>
                  <span className="text-xs text-alo-faint">{c.level}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-alo-navy group-hover:text-alo-blue">
                  {c.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-alo-muted">
                  {c.description}
                </p>
                <div className="mt-auto flex items-center justify-between pt-4 text-sm">
                  <span className="text-alo-faint">
                    {c.duration}h · {c._count?.enrollments ?? 0} enrolled
                  </span>
                  <span className="font-semibold text-alo-orange">
                    {c.price === 0 ? "Free" : formatCurrency(c.price, c.currency)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
