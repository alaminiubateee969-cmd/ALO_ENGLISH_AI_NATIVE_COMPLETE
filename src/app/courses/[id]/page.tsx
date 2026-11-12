"use client";

/**
 * src/app/courses/[id]/page.tsx
 *
 * Course Detail Page — shows full course information:
 *   - University name + course URL
 *   - Course overview
 *   - Entry requirements
 *   - IELTS / alternative test requirements
 *   - Tuition fee
 *   - Scholarship info
 *   - Application deadline
 *   - Intakes (minimum 2)
 *   - Apply Now button (links to /apply/[courseId])
 */

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Building2, DollarSign, Calendar, GraduationCap, Award, FileText, ArrowLeft, CheckCircle2 } from "lucide-react";

type CourseDetail = {
  id: string;
  name: string;
  level: string | null;
  duration: string | null;
  tuitionFee: number | null;
  currency: string;
  description: string | null;
  entryRequirements: string | null;
  university: {
    id: string;
    name: string;
    city: string | null;
    country: string | null;
    website: string | null;
    description: string | null;
  };
  intakes: Array<{ id: string; month: string; year: number; deadline: string | null }>;
};

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/courses/${courseId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCourse(d.data.course);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-slate-400">Loading course details...</div>;
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-slate-500">Course not found.</p>
        <a href="/course-finder" className="mt-2 inline-block text-orange-600 hover:underline">← Back to Course Finder</a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb */}
      <a href="/course-finder" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-orange-600">
        <ArrowLeft className="h-4 w-4" /> Back to Course Finder
      </a>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{course.name}</h1>
        <a
          href={`/universities/${course.university.id}`}
          className="mt-2 inline-flex items-center gap-1 text-slate-600 hover:text-orange-600"
        >
          <Building2 className="h-4 w-4" />
          {course.university.name}
          {course.university.city ? `, ${course.university.city}` : ""}
          {course.university.country ? `, ${course.university.country}` : ""}
        </a>
        {course.university.website && (
          <a
            href={course.university.website}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-sm text-blue-600 hover:underline"
          >
            Visit University Website →
          </a>
        )}
      </div>

      {/* Key Info Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {course.tuitionFee && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <DollarSign className="h-5 w-5 text-green-600 mb-1" />
            <p className="text-xs text-slate-500">Tuition Fee</p>
            <p className="text-lg font-bold text-slate-900">${course.tuitionFee.toLocaleString()}/yr</p>
          </div>
        )}
        {course.level && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <GraduationCap className="h-5 w-5 text-blue-600 mb-1" />
            <p className="text-xs text-slate-500">Study Level</p>
            <p className="text-lg font-bold text-slate-900">{course.level}</p>
          </div>
        )}
        {course.duration && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <Calendar className="h-5 w-5 text-purple-600 mb-1" />
            <p className="text-xs text-slate-500">Duration</p>
            <p className="text-lg font-bold text-slate-900">{course.duration}</p>
          </div>
        )}
        {course.intakes.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <Calendar className="h-5 w-5 text-orange-600 mb-1" />
            <p className="text-xs text-slate-500">Intakes</p>
            <p className="text-lg font-bold text-slate-900">{course.intakes.length}</p>
          </div>
        )}
      </div>

      {/* Course Overview */}
      {course.description && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
            <FileText className="h-5 w-5 text-slate-400" /> Course Overview
          </h2>
          <p className="text-sm text-slate-600 whitespace-pre-line">{course.description}</p>
        </div>
      )}

      {/* Entry Requirements */}
      {course.entryRequirements && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
            <CheckCircle2 className="h-5 w-5 text-slate-400" /> Entry Requirements
          </h2>
          <p className="text-sm text-slate-600 whitespace-pre-line">{course.entryRequirements}</p>
        </div>
      )}

      {/* IELTS / English Test Requirements */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
          <Award className="h-5 w-5 text-slate-400" /> English Language Requirements
        </h2>
        <div className="space-y-2 text-sm text-slate-600">
          <p><strong>IELTS Academic:</strong> Typically 6.5 overall (6.0 minimum per band) — check university page for exact requirements.</p>
          <p><strong>Alternative Tests Accepted:</strong></p>
          <ul className="ml-4 list-disc space-y-1">
            <li>PTE Academic — typically 58-65 overall</li>
            <li>TOEFL iBT — typically 90-100 overall</li>
            <li>Duolingo English Test — typically 110-120</li>
            <li>LanguageCert — typically B2 Communicator</li>
          </ul>
          <p className="mt-2 text-xs text-slate-400">* Exact requirements vary by course and university. Please verify on the official university website.</p>
        </div>
      </div>

      {/* Tuition & Scholarship */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-900">
            <DollarSign className="h-5 w-5 text-green-600" /> Tuition Fee
          </h2>
          <p className="text-2xl font-bold text-green-600">
            {course.tuitionFee ? `$${course.tuitionFee.toLocaleString()}` : "Contact us"}
          </p>
          <p className="text-xs text-slate-500">per academic year ({course.currency})</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-900">
            <Award className="h-5 w-5 text-amber-600" /> Scholarships
          </h2>
          <p className="text-sm text-slate-600">
            Merit-based and need-based scholarships available. Contact our counselors for:
          </p>
          <ul className="mt-2 ml-4 list-disc text-sm text-slate-600">
            <li>University-specific scholarships</li>
            <li>Government scholarships (Chevening, Commonwealth)</li>
            <li>ALO Education partner discounts</li>
          </ul>
          <a href="/contact" className="mt-2 inline-block text-sm text-orange-600 hover:underline">Ask about scholarships →</a>
        </div>
      </div>

      {/* Intakes & Deadlines */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
          <Calendar className="h-5 w-5 text-orange-600" /> Intakes & Application Deadlines
        </h2>
        {course.intakes.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {course.intakes.map((intake) => (
              <div key={intake.id} className="rounded-lg border border-slate-200 p-3">
                <p className="font-semibold text-slate-900">{intake.month} {intake.year}</p>
                {intake.deadline && (
                  <p className="text-xs text-slate-500">
                    Deadline: {new Date(intake.deadline).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Contact us for intake information.</p>
        )}
      </div>

      {/* Apply Now */}
      <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-6 text-center">
        <h2 className="mb-2 text-xl font-bold text-slate-900">Ready to Apply?</h2>
        <p className="mb-4 text-sm text-slate-600">Start your application today. Login or registration required.</p>
        <a
          href={`/apply/${course.id}`}
          className="inline-block rounded-lg bg-orange-500 px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-orange-600"
        >
          Apply Now →
        </a>
      </div>
    </div>
  );
}
