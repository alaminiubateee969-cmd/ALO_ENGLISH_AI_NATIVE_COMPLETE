import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Globe, GraduationCap, Users, Award, BookOpen, Plane, Mail, Phone, Clock } from "lucide-react";
import { StudentJourneyDiagram } from "@/components/site/student-journey-diagram";

export const metadata: Metadata = {
  title: "ALO Education — Study Abroad Consultancy | UK · Canada · Australia · USA · Ireland · NZ · Dubai",
  description:
    "ALO Education helps students study abroad in the UK, Canada, Australia, USA, Ireland, New Zealand and Dubai. University applications, scholarships, visas, English test preparation, and expert counseling.",
  keywords: ["study abroad", "university applications", "scholarships", "visa guidance", "IELTS", "PTE", "TOEFL", "ALO Education"],
  openGraph: {
    title: "ALO Education — Study Abroad Consultancy",
    description: "Expert guidance for studying in the UK, Canada, Australia, USA, Ireland, NZ and Dubai.",
    type: "website",
  },
};

const DESTINATIONS = [
  { country: "United Kingdom", flag: "🇬🇧", desc: "Explore institutions, subject options and current application guidance.", link: "/destinations" },
  { country: "Canada", flag: "🇨🇦", desc: "Compare programs and review current official study requirements.", link: "/destinations" },
  { country: "Australia", flag: "🇦🇺", desc: "Explore universities, programs and application information.", link: "/destinations" },
  { country: "United States", flag: "🇺🇸", desc: "Browse a wide range of institutions, courses and pathways.", link: "/destinations" },
  { country: "Ireland", flag: "🇮🇪", desc: "Explore institutions, English-taught programs and entry requirements.", link: "/destinations" },
  { country: "New Zealand", flag: "🇳🇿", desc: "Review study options and check current official requirements.", link: "/destinations" },
  { country: "Dubai (UAE)", flag: "🇦🇪", desc: "Explore local and international study options across the UAE.", link: "/destinations" },
];

const SERVICES = [
  { icon: GraduationCap, title: "University Applications", desc: "Guidance on researching institutions, preparing materials and navigating application steps." },
  { icon: Plane, title: "Visa Guidance", desc: "Practical guidance, document checklists and interview preparation." },
  { icon: Award, title: "Scholarship Assistance", desc: "Explore scholarship options that may fit your profile and destination." },
  { icon: BookOpen, title: "English Test Preparation", desc: "Find practice resources for IELTS, PTE, TOEFL and Duolingo English Test." },
  { icon: Users, title: "Course Selection", desc: "Compare course options with your academic background and interests in mind." },
  { icon: Globe, title: "Pre-departure Briefing", desc: "Prepare questions about accommodation, banking, culture and student life." },
];

const TESTS = [
  { name: "IELTS", description: "Explore practice resources and preparation guidance." },
  { name: "PTE Academic", description: "Explore practice resources and preparation guidance." },
  { name: "TOEFL iBT", description: "Explore practice resources and preparation guidance." },
  { name: "Duolingo English Test", description: "Explore practice resources and preparation guidance." },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:py-28">
          <div className="max-w-3xl">
            <p className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur">
              Study abroad guidance
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Explore your next study step
            </h1>
            <p className="mt-6 text-lg text-blue-50 sm:text-xl">
              Explore destinations, compare courses, prepare for English tests, and plan the questions you want to ask.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/book-consultation"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700"
              >
                Request a consultation <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/course-finder"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700"
              >
                Find Your Course
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-slate-900">Study Destinations</h2>
            <p className="mt-2 text-slate-600">Explore the destinations currently listed by ALO Education</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {DESTINATIONS.map((d) => (
              <Link
                key={d.country}
                href={d.link}
                className="group rounded-xl border border-slate-200 bg-white p-6 transition-colors hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <div className="mb-3 text-4xl">{d.flag}</div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700">{d.country}</h3>
                <p className="mt-1 text-sm text-slate-600">{d.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-slate-900">Our Services</h2>
            <p className="mt-2 text-slate-600">Complete support for your study abroad journey</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <div key={s.title} className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-lg transition">
                <div className="mb-4 inline-flex rounded-lg bg-blue-50 p-3">
                  <s.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/services" className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline">
              View all services <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* English Test Prep */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-slate-900">English Test Preparation</h2>
            <p className="mt-2 text-slate-600">Prepare for your English proficiency test with us</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TESTS.map((test) => (
              <div key={test.name} className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                <h3 className="text-lg font-bold text-slate-900">{test.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{test.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/language-prep" className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 font-semibold text-blue-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
              Learn more about test prep <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <StudentJourneyDiagram />

      {/* Why Choose Us */}
      <section className="bg-blue-700 py-16 lg:py-20 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">Plan with clear next steps</h2>
            <p className="mt-2 text-blue-100">Use ALO resources to explore study options and English-test practice.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Explore destinations", desc: "Compare the study destinations and resources listed by ALO Education." },
              { title: "Research courses", desc: "Use the course finder to organise options around your interests and background." },
              { title: "Practise English", desc: "Explore preparation resources for IELTS, PTE, TOEFL and Duolingo English Test." },
              { title: "Review estimates", desc: "Treat practice scores and automated feedback as study aids, not official results." },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm text-blue-100">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900">Ready to Start Your Journey?</h2>
          <p className="mt-3 text-lg text-slate-600">
            Tell us what you are planning and request a consultation with ALO Education.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
            <Link
              href="/book-consultation"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Request a consultation <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-8 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="border-t bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-3"><Phone className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Call Us</p>
                <a className="text-sm text-slate-600 hover:text-blue-700" href="tel:+8801700000000">+880 1700-000000</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-3"><Mail className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Email Us</p>
                <a className="text-sm text-slate-600 hover:text-blue-700" href="mailto:info@aloeducation.com">info@aloeducation.com</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-3"><Clock className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Office Hours</p>
                <p className="text-sm text-slate-600">Sat–Thu: 10AM–6PM</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
