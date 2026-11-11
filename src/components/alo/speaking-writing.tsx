"use client";

import Link from "next/link";
import { ArrowRight, Mic, PenLine } from "lucide-react";

/** An honest entry point to the session-only speaking conversation page. */
export function AloSpeakingPractice() {
  return (
    <section id="speaking" className="bg-alo-soft-blue py-16 lg:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-alo-blue/20 bg-alo-soft-blue px-3 py-1 text-xs font-semibold text-alo-blue">
            <Mic className="h-3.5 w-3.5" />
            Speaking conversation practice
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-alo-navy">
            Practise a speaking conversation
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-alo-muted">
            The live practice page captures audio for transcription and a conversational response. It does not save a scored exam attempt or assess acoustic pronunciation or fluency. Provider processing and retention have not been independently verified; do not submit sensitive information.
          </p>
          <Link
            href="/live-exam"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-alo-blue px-5 py-3 text-sm font-semibold text-white hover:bg-[#004a9e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alo-blue focus-visible:ring-offset-2"
          >
            Open speaking conversation practice <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Honest entry point to the server-backed practice-attempt writing guidance. */
export function AloWritingEvaluation() {
  return (
    <section id="writing" className="bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-alo-orange/20 bg-alo-soft-orange px-3 py-1 text-xs font-semibold text-alo-orange">
            <PenLine className="h-3.5 w-3.5" />
            Writing practice
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-alo-navy">
            Get non-scored writing suggestions
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-alo-muted">
            The practice-attempt flow can return generic local text suggestions and a word count. It does not produce a rubric-based or calibrated writing score. Check the prompt’s requirements and review the suggestions critically.
          </p>
          <Link
            href="/practice-test"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-alo-orange px-5 py-3 text-sm font-semibold text-white hover:bg-[#d2460f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alo-orange focus-visible:ring-offset-2"
          >
            Choose a practice test <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
