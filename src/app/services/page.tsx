import type { Metadata } from "next";
export const metadata: Metadata = { title: "Our Services", description: "University application, visa, scholarship, and test preparation services." };

const SERVICES = [
  { title: "University Applications", icon: "🎓", desc: "End-to-end application management for 1000+ universities across 7 countries." },
  { title: "Visa Guidance", icon: "✈️", desc: "Complete visa application support including document checklists and interview prep." },
  { title: "Scholarship Assistance", icon: "💰", desc: "Identify and apply for scholarships that match your profile and destination." },
  { title: "English Test Preparation", icon: "📚", desc: "IELTS, PTE, TOEFL, Duolingo practice tests and coaching." },
  { title: "Course Selection", icon: "🧭", desc: "Personalized course recommendations based on your academic background and career goals." },
  { title: "Pre-departure Briefing", icon: "🧳", desc: "Comprehensive briefings on accommodation, banking, culture, and student life." },
  { title: "SOP & CV Writing", icon: "✍️", desc: "Professional statement of purpose and CV writing assistance." },
  { title: "Post-Arrival Support", icon: "🤝", desc: "Airport pickup, SIM card, bank account setup, and ongoing support." },
];

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Our Services</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">Complete support for your study abroad journey, from application to arrival.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map((s) => (
          <div key={s.title} className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-3">{s.icon}</div>
            <h2 className="text-lg font-bold mb-2">{s.title}</h2>
            <p className="text-sm text-slate-600">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
