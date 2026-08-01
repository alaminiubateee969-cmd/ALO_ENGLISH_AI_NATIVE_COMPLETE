import type { Metadata } from "next";
export const metadata: Metadata = { title: "Resources", description: "Study abroad guides, blogs, and resources." };

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Resources</h1>
        <p className="text-lg text-slate-600">Guides, articles, and tools to support your study abroad journey.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {["Study Abroad Guide", "Visa Requirements", "Scholarship Tips", "University Rankings", "English Test Tips", "Pre-departure Checklist"].map((r) => (
          <div key={r} className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-lg transition">
            <h2 className="text-lg font-bold mb-2">{r}</h2>
            <p className="text-sm text-slate-600">Comprehensive guide coming soon. Contact us for immediate assistance.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
