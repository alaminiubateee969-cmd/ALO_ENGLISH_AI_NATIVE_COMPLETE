import type { Metadata } from "next";
export const metadata: Metadata = { title: "Contact Us", description: "Get in touch with ALO Education." };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Contact Us</h1>
        <p className="text-lg text-slate-600">We are here to help with your study abroad questions.</p>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 p-4">
            <h2 className="font-semibold mb-1">Office</h2>
            <p className="text-sm text-slate-600">ALO Education<br />Dhaka, Bangladesh</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <h2 className="font-semibold mb-1">Email</h2>
            <p className="text-sm text-slate-600">info@aloeducation.com</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <h2 className="font-semibold mb-1">Phone</h2>
            <p className="text-sm text-slate-600">+880 1700-000000</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <h2 className="font-semibold mb-1">Hours</h2>
            <p className="text-sm text-slate-600">Sat - Thu: 10:00 AM - 6:00 PM<br />Friday: Closed</p>
          </div>
        </div>
        <form className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input type="text" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input type="tel" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea rows={4} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required></textarea>
          </div>
          <button type="submit" className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Send Message</button>
        </form>
      </div>
    </div>
  );
}
