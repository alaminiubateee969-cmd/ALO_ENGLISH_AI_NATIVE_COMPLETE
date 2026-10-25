"use client";

/**
 * src/app/universities/[id]/page.tsx
 *
 * University Detail Page — shows university info + list of courses.
 * Clicking a course goes to the course detail page.
 */

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Building2, MapPin, Globe, ArrowLeft, ArrowRight } from "lucide-react";

type UniversityDetail = {
  id: string;
  name: string;
  city: string | null;
  country: { name: string } | null;
  website: string | null;
  description: string | null;
};

type Course = {
  id: string;
  name: string;
  level: string | null;
  tuitionFee: number | null;
  duration: string | null;
};

export default function UniversityDetailPage() {
  const params = useParams();
  const uniId = params.id as string;
  const [uni, setUni] = useState<UniversityDetail | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/crm/universities?limit=100`).then((r) => r.json()),
      fetch(`/api/courses?universityId=${uniId}`).then((r) => r.json()),
    ]).then(([uniData, courseData]) => {
      if (uniData.success) {
        const found = uniData.data.universities?.find((u: UniversityDetail) => u.id === uniId);
        if (found) setUni(found);
      }
      if (courseData.success) {
        setCourses(courseData.data.courses);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [uniId]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-slate-400">Loading university details...</div>;
  }

  if (!uni) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-slate-500">University not found.</p>
        <a href="/course-finder" className="mt-2 inline-block text-orange-600 hover:underline">← Back to Course Finder</a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <a href="/course-finder" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-orange-600">
        <ArrowLeft className="h-4 w-4" /> Back to Course Finder
      </a>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{uni.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          {uni.city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {uni.city}{uni.country?.name ? `, ${uni.country.name}` : ""}
            </span>
          )}
          {uni.website && (
            <a href={uni.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
              <Globe className="h-4 w-4" /> Visit Website
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      {uni.description && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-900">
            <Building2 className="h-5 w-5 text-slate-400" /> About {uni.name}
          </h2>
          <p className="text-sm text-slate-600 whitespace-pre-line">{uni.description}</p>
        </div>
      )}

      {/* Courses List */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Available Courses ({courses.length})</h2>
        {courses.length > 0 ? (
          <div className="space-y-3">
            {courses.map((course) => (
              <div key={course.id} className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <a
                      href={`/courses/${course.id}`}
                      className="text-base font-bold text-slate-900 hover:text-orange-600"
                    >
                      {course.name}
                    </a>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                      {course.level && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">{course.level}</span>
                      )}
                      {course.duration && <span>Duration: {course.duration}</span>}
                      {course.tuitionFee && (
                        <span className="font-medium text-green-600">${course.tuitionFee.toLocaleString()}/yr</span>
                      )}
                    </div>
                  </div>
                  <a
                    href={`/courses/${course.id}`}
                    className="shrink-0 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-100"
                  >
                    View Details <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No courses available for this university yet.</p>
        )}
      </div>
    </div>
  );
}
