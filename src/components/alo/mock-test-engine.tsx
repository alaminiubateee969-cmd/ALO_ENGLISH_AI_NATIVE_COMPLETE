"use client";

import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExamType } from "@/lib/question-bank";

/**
 * Legacy in-memory mock engine retired.
 *
 * The previous component used local sample questions, a browser-only timer,
 * and a client-side score calculation. Those results were not persisted and
 * were not valid exam attempts. Route learners to the authenticated attempt
 * workflow instead; a real attempt is only available when its database-backed
 * practice set is configured.
 */
export function MockTestEngine({ initialExam }: { initialExam?: ExamType }) {
  return (
    <section
      aria-labelledby="practice-engine-title"
      className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="practice-engine-title" className="text-xl font-bold text-slate-900">
            Use a saved practice attempt
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {initialExam ? `Selected preparation: ${initialExam}. ` : ""}
            This legacy browser-only test has been retired because its sample questions and local score were not saved as a real attempt. No result is created here.
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        Continue to the authenticated practice workflow. It will only start a test when an active database practice set is available.
      </p>
      <Button asChild className="mt-5 min-h-11 rounded-xl bg-[#0057B8] text-white hover:bg-[#004a9e]">
        <Link href="/practice-test">
          Open practice tests <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </section>
  );
}
