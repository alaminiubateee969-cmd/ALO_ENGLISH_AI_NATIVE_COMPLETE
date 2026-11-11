import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Compass, GraduationCap } from "lucide-react";
import { LeadCaptureForm } from "@/components/site/lead-capture-form";

export const metadata: Metadata = {
  title: "Contact ALO Education",
  description: "Send ALO Education a question about English-test preparation or study-abroad planning.",
};

const QUICK_LINKS = [
  { title: "English-test preparation", href: "/language-prep", icon: BookOpen },
  { title: "Study destinations", href: "/destinations", icon: Compass },
  { title: "Course finder", href: "/course-finder", icon: GraduationCap },
] as const;

export default function ContactPage() {
  return (
    <div className="bg-[#F8FAFC]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-9 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C2410C]">We are ready to listen</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[#0B1F3A]">How can we help?</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">Send a message about English-test preparation or your study-abroad plans. Share only the details needed for us to respond.</p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold text-[#0B1F3A]">Explore while you wait</h2>
              <ul className="mt-4 space-y-2">
                {QUICK_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="group flex min-h-11 items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8]">
                      <span className="flex items-center gap-2.5"><item.icon className="size-4 text-[#0057B8]" aria-hidden="true" />{item.title}</span>
                      <ArrowRight className="size-4 text-[#0057B8] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 text-sm leading-6 text-slate-700">
              <p className="font-semibold text-[#0B1F3A]">Your request goes to ALO Education</p>
              <p className="mt-1">Please do not send passwords, payment details or sensitive identity documents through this general contact form.</p>
              <Link href="/privacy-policy" className="mt-3 inline-flex min-h-9 items-center gap-1 font-semibold text-[#0057B8] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8]">
                Read our privacy policy <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </aside>

          <section aria-labelledby="contact-form-title" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <h2 id="contact-form-title" className="text-xl font-bold text-[#0B1F3A]">Send us a message</h2>
            <p className="mb-5 mt-1 text-sm text-slate-600">Add a short description and the best way for our team to reach you.</p>
            <LeadCaptureForm variant="contact" />
          </section>
        </div>
      </div>
    </div>
  );
}
