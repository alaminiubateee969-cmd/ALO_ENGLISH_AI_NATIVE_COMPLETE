import type { Metadata } from "next";
export const metadata: Metadata = { title: "Study Destinations", description: "Explore study destinations: UK, Canada, Australia, USA, Ireland, New Zealand, Dubai." };

const DESTINATIONS = [
  { country: "United Kingdom", code: "uk", flag: "🇬🇧", desc: "World-class universities, 2-year post-study work visa, rich academic heritage.", popular: ["London", "Manchester", "Edinburgh", "Birmingham"] },
  { country: "Canada", code: "ca", flag: "🇨🇦", desc: "Affordable tuition, friendly immigration policies, post-graduation work permit.", popular: ["Toronto", "Vancouver", "Montreal", "Calgary"] },
  { country: "Australia", code: "au", flag: "🇦🇺", desc: "Top-ranked universities, beautiful climate, strong graduate outcomes.", popular: ["Sydney", "Melbourne", "Brisbane", "Perth"] },
  { country: "United States", code: "us", flag: "🇺🇸", desc: "Largest selection of universities, OPT and CPT work opportunities.", popular: ["New York", "Boston", "California", "Texas"] },
  { country: "Ireland", code: "ie", flag: "🇮🇪", desc: "English-speaking EU country, tech hub, 2-year stay-back option.", popular: ["Dublin", "Cork", "Galway"] },
  { country: "New Zealand", code: "nz", flag: "🇳🇿", desc: "High quality of life, safe environment, post-study work rights.", popular: ["Auckland", "Wellington", "Christchurch"] },
  { country: "Dubai (UAE)", code: "ae", flag: "🇦🇪", desc: "Tax-free income, growing education sector, strategic location.", popular: ["Dubai", "Abu Dhabi", "Sharjah"] },
];

export default function DestinationsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Study Destinations</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">Choose your study abroad destination. Each country offers unique opportunities for international students.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {DESTINATIONS.map((d) => (
          <div key={d.code} className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-lg transition">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{d.flag}</span>
              <h2 className="text-xl font-bold text-slate-900">{d.country}</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">{d.desc}</p>
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Popular Cities</p>
              <div className="flex flex-wrap gap-2">
                {d.popular.map((c) => (
                  <span key={c} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{c}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
