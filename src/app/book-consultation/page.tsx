import type { Metadata } from "next";
export const metadata: Metadata = { title: "Book Free Consultation", description: "Book a free consultation with ALO Education." };

export default function BookConsultationPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3">Book a Free Consultation</h1>
        <p className="text-lg text-slate-600">Speak with an expert counselor about your study abroad plans.</p>
      </div>
      <form className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input type="text" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input type="text" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input type="tel" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Preferred Country</label>
            <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option>Select...</option><option>UK</option><option>Canada</option><option>Australia</option><option>USA</option><option>Ireland</option><option>New Zealand</option><option>Dubai</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Preferred Date</label>
            <input type="date" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Message</label>
          <textarea rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Tell us about your study plans..."></textarea>
        </div>
        <button type="submit" className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">Book Consultation</button>
      </form>
    </div>
  );
}
