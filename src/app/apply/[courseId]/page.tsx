"use client";

/**
 * src/app/apply/[courseId]/page.tsx
 *
 * Form A — Apply Now (Public Website)
 *
 * Flow:
 *   1. If not logged in → show login/register prompt
 *   2. If logged in → create draft application, redirect to Form B
 *
 * Apply Now NEVER shows success unless Form B is fully completed.
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Lock, GraduationCap, Building2, ArrowRight, CheckCircle2 } from "lucide-react";

type Course = {
  id: string;
  name: string;
  level: string | null;
  tuitionFee: number | null;
  university: {
    id: string;
    name: string;
    city: string | null;
    country: string | null;
  };
};

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [authState, setAuthState] = useState<"checking" | "authenticated" | "unauthenticated">("checking");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch course details
    fetch(`/api/courses/${courseId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCourse(d.data.course);
      })
      .catch(() => {});

    // Check auth status
    fetch("/api/auth/me")
      .then((r) => {
        if (r.ok) return r.json();
        throw new Error("Not authenticated");
      })
      .then((d) => {
        if (d.success) {
          setAuthState("authenticated");
        } else {
          setAuthState("unauthenticated");
        }
      })
      .catch(() => setAuthState("unauthenticated"));
  }, [courseId]);

  const createDraftAndProceed = async () => {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/applications/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (data.success) {
        // Redirect to Form B (application form)
        router.push(`/student/applications?draftId=${data.data.draftId}`);
      } else {
        setError(data.message || "Failed to start application");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  if (authState === "checking") {
    return <div className="mx-auto max-w-2xl px-4 py-12 text-center text-slate-400">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Course Summary */}
      {course && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-2xl font-bold text-slate-900">{course.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <Building2 className="h-4 w-4" />
            {course.university.name}
            {course.university.city ? `, ${course.university.city}` : ""}
            {course.university.country ? `, ${course.university.country}` : ""}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-slate-500">
            {course.level && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">{course.level}</span>
            )}
            {course.tuitionFee && (
              <span className="font-medium text-green-600">${course.tuitionFee.toLocaleString()}/yr</span>
            )}
          </div>
        </div>
      )}

      {/* If authenticated — proceed to Form B */}
      {authState === "authenticated" ? (
        <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-white">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900">Start Your Application</h2>
          <p className="mb-6 text-sm text-slate-600">
            You're logged in and ready to apply. Click below to start the full application form.
            Your progress will be saved automatically.
          </p>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}
          <button
            onClick={createDraftAndProceed}
            disabled={creating}
            className="rounded-lg bg-orange-500 px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-orange-600 disabled:opacity-50"
          >
            {creating ? "Starting..." : "Start Application Form →"}
          </button>
          <p className="mt-4 text-xs text-slate-400">
            * Apply Now does not guarantee admission. You must complete the full application form (Form B) to submit your application.
          </p>
        </div>
      ) : (
        /* If not authenticated — login/register prompt */
        <div className="rounded-xl border-2 border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-400 text-white">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900">Login Required</h2>
          <p className="mb-6 text-sm text-slate-600">
            You need to login or register to start your application. This ensures your application is saved
            and you can track its status.
          </p>
          <div className="flex justify-center gap-3">
            <a
              href={`/login?redirect=/apply/${courseId}`}
              className="rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Login
            </a>
            <a
              href={`/register?redirect=/apply/${courseId}`}
              className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Register
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
