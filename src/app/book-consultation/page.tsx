import type { Metadata } from "next";
import { LeadCaptureForm } from "@/components/site/lead-capture-form";

export const metadata: Metadata = { title: "Book Free Consultation", description: "Book a free consultation with ALO Education." };

export default function BookConsultationPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="mb-3 text-4xl font-bold">Book a Consultation</h1>
        <p className="text-lg text-slate-600">Tell us about your study abroad plans and we will follow up.</p>
      </div>
      <section aria-labelledby="consultation-form-title" className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 id="consultation-form-title" className="mb-1 text-xl font-bold">Request a consultation</h2>
        <p className="mb-5 text-sm text-slate-600">Share your contact details and preferred date. We will confirm availability with you.</p>
        <LeadCaptureForm variant="consultation" />
      </section>
    </div>
  );
}
