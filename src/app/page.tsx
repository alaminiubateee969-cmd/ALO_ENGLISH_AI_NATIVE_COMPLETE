import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Globe, GraduationCap, Users, Award, BookOpen, Plane, Mail, Phone, Clock } from "lucide-react";

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
  { country: "United Kingdom", flag: "🇬🇧", desc: "World-class universities, 2-year post-study work visa.", link: "/destinations" },
  { country: "Canada", flag: "🇨🇦", desc: "Affordable tuition, friendly immigration policies.", link: "/destinations" },
  { country: "Australia", flag: "🇦🇺", desc: "Top-ranked universities, strong graduate outcomes.", link: "/destinations" },
  { country: "United States", flag: "🇺🇸", desc: "Largest selection of universities, OPT/CPT opportunities.", link: "/destinations" },
  { country: "Ireland", flag: "🇮🇪", desc: "English-speaking EU country, tech hub, 2-year stay-back.", link: "/destinations" },
  { country: "New Zealand", flag: "🇳🇿", desc: "High quality of life, safe environment, post-study work.", link: "/destinations" },
  { country: "Dubai (UAE)", flag: "🇦🇪", desc: "Tax-free income, growing education sector.", link: "/destinations" },
];

const SERVICES = [
  { icon: GraduationCap, title: "University Applications", desc: "End-to-end application management for 1000+ universities across 7 countries." },
  { icon: Plane, title: "Visa Guidance", desc: "Complete visa application support including document checklists and interview prep." },
  { icon: Award, title: "Scholarship Assistance", desc: "Identify and apply for scholarships that match your profile and destination." },
  { icon: BookOpen, title: "English Test Preparation", desc: "IELTS, PTE, TOEFL, and Duolingo practice tests and coaching." },
  { icon: Users, title: "Course Selection", desc: "Personalized course recommendations based on your academic background and career goals." },
  { icon: Globe, title: "Pre-departure Briefing", desc: "Comprehensive briefings on accommodation, banking, culture, and student life." },
];

const STATS = [
  { value: "7", label: "Countries" },
  { value: "1000+", label: "University Partners" },
  { value: "5000+", label: "Students Placed" },
  { value: "98%", label: "Visa Success Rate" },
];

const TESTS = [
  { name: "IELTS", desc: "Band 0–9", duration: "2h 45m" },
  { name: "PTE Academic", desc: "10–90", duration: "2h 00m" },
  { name: "TOEFL iBT", desc: "0–120", duration: "2h 00m" },
  { name: "Duolingo", desc: "10–160", duration: "1h 00m" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:py-28">
          <div className="max-w-3xl">
            <p className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur">
              🎓 Trusted Study Abroad Consultancy
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Your Gateway to Studying Abroad
            </h1>
            <p className="mt-6 text-lg text-blue-50 sm:text-xl">
              Expert guidance for university applications, scholarships, visas, and English test
              preparation across 7 countries. Let us help you achieve your study abroad dreams.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/book-consultation"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                Book Free Consultation <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/course-finder"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Find Your Course
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-blue-700">{s.value}</p>
                <p className="text-sm text-slate-600">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-slate-900">Study Destinations</h2>
            <p className="mt-2 text-slate-600">Choose from 7 popular study abroad destinations</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {DESTINATIONS.map((d) => (
              <Link
                key={d.country}
                href={d.link}
                className="group rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-300 hover:shadow-lg transition"
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
            {TESTS.map((t) => (
              <div key={t.name} className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                <h3 className="text-lg font-bold text-slate-900">{t.name}</h3>
                <p className="mt-2 text-sm text-slate-500">Scoring: {t.desc}</p>
                <p className="text-sm text-slate-500">Duration: {t.duration}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/language-prep" className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline">
              Learn more about test prep <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-blue-700 py-16 lg:py-20 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">Why Choose ALO Education?</h2>
            <p className="mt-2 text-blue-100">Trusted by thousands of students worldwide</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Expert Counselors", desc: "Certified counselors with years of experience in international education." },
              { title: "High Success Rate", desc: "98% visa success rate and thousands of successful university placements." },
              { title: "End-to-End Support", desc: "From course selection to post-arrival support, we are with you every step." },
              { title: "Transparent Process", desc: "No hidden fees. Clear timelines. Honest advice throughout your journey." },
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
            Book a free consultation with our expert counselors today.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
            <Link
              href="/book-consultation"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Book Free Consultation <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-8 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
                <p className="text-sm text-slate-600">+880 1700-000000</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-3"><Mail className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Email Us</p>
                <p className="text-sm text-slate-600">info@aloeducation.com</p>
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
