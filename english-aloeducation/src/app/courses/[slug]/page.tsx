import Link from "next/link";
import { notFound } from "next/navigation";

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
  syllabus?: string | null;
  imageUrl?: string | null;
  _count?: { enrollments: number; classes: number };
};

async function fetchCourse(slug: string): Promise<Course | null> {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3002";
  try {
    const res = await fetch(`${base}/api/courses/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await fetchCourse(slug);
  if (!course) notFound();

  return (
    <main className="bg-alo-soft-gray min-h-screen">
      <section className="bg-alo-navy text-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <Link href="/courses" className="text-sm text-blue-200 hover:text-white">
            ← Back to courses
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-white/20">
              {course.category}
            </span>
            <span className="text-xs text-blue-200">{course.level} level</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">{course.title}</h1>
          <p className="mt-3 max-w-3xl text-blue-100">{course.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm">
            <span className="text-blue-100">Duration: {course.duration} hours</span>
            <span className="text-blue-100">
              Enrolled: {course._count?.enrollments ?? 0}
            </span>
            <span className="text-2xl font-bold text-alo-orange">
              {course.price === 0 ? "Free" : formatCurrency(course.price, course.currency)}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold text-alo-navy">Course overview</h2>
            <p className="mt-3 text-alo-muted">{course.description}</p>

            {course.syllabus && (
              <>
                <h3 className="mt-8 text-lg font-semibold text-alo-navy">Syllabus</h3>
                <div className="mt-3 whitespace-pre-wrap rounded-xl border border-alo-card bg-white p-6 text-sm text-alo-muted">
                  {course.syllabus}
                </div>
              </>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-alo-card bg-white p-6 shadow-alo">
              <p className="text-sm text-alo-muted">Course code</p>
              <p className="font-mono text-sm text-alo-navy">{course.courseCode}</p>
              <div className="mt-6">
                <Link
                  href="/register"
                  className="block w-full rounded-lg bg-alo-orange px-4 py-2.5 text-center font-semibold text-white transition hover:bg-orange-600"
                >
                  Enroll now
                </Link>
              </div>
              <p className="mt-3 text-center text-xs text-alo-faint">
                Need help? <Link href="/contact" className="text-alo-blue hover:underline">Contact us</Link>
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
