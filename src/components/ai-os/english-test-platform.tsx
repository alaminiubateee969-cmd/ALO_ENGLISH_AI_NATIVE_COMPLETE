"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ModuleId } from "./module-registry";

/**
 * The former hidden English Test Platform contained hard-coded students,
 * results, questions, and client-only scoring. Retire that shell rather than
 * presenting those fixtures as learner or operational data. The links below
 * lead to the database-backed routes; their current availability still
 * depends on the active deployment data and configured services.
 */
export default function EnglishTestPlatform({ navigate }: { navigate: (id: ModuleId) => void }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate("home")}
          className="mb-6 -ml-3 text-slate-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          AI OS home
        </Button>

        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Legacy shell retired</p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900">English Test Platform</h1>
            <p className="mt-3 leading-7 text-slate-600">
              This shell previously showed hard-coded sample exams, student records, and scores. Those fixtures were not connected to persisted attempts, so they are no longer displayed and must not be treated as real results.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
          Exam availability and results must come from the authenticated APIs and the active database. Practice feedback is not an official test score.
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="min-h-11 rounded-xl bg-[#0057B8] text-white hover:bg-[#004a9e]">
            <Link href="/practice-test">
              Open practice tests <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11 rounded-xl">
            <Link href="/exam-prep">
              <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
              View configured exam data
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
