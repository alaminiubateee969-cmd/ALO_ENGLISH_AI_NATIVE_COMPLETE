import type { Metadata } from "next";
import { LeadCaptureForm } from "@/components/site/lead-capture-form";

export const metadata: Metadata = { title: "Contact Us", description: "Get in touch with ALO Education." };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-bold">Contact Us</h1>
        <p className="text-lg text-slate-600">We are here to help with your study abroad questions.</p>
      </div>
      <div className="grid items-start gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 p-5">
            <h2 className="mb-1 font-semibold">Office</h2>
            <p className="text-sm text-slate-600">ALO Education<br />Dhaka, Bangladesh</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-5">
            <h2 className="mb-1 font-semibold">Email</h2>
            <a className="text-sm text-blue-700 underline underline-offset-2" href="mailto:info@aloeducation.com">info@aloeducation.com</a>
          </div>
          <div className="rounded-xl border border-slate-200 p-5">
            <h2 className="mb-1 font-semibold">Phone</h2>
            <a className="text-sm text-blue-700 underline underline-offset-2" href="tel:+8801700000000">+880 1700-000000</a>
          </div>
          <div className="rounded-xl border border-slate-200 p-5">
            <h2 className="mb-1 font-semibold">Hours</h2>
            <p className="text-sm text-slate-600">Sat - Thu: 10:00 AM - 6:00 PM<br />Friday: Closed</p>
          </div>
        </div>
        <section aria-labelledby="contact-form-title" className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 id="contact-form-title" className="mb-4 text-xl font-bold">Send us a message</h2>
          <LeadCaptureForm variant="contact" />
        </section>
      </div>
    </div>
  );
}
