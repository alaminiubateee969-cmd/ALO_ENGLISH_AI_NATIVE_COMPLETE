import type { Metadata } from "next";
export const metadata: Metadata = { title: "Events", description: "University fairs, webinars, and information sessions." };

export default function EventsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Events</h1>
        <p className="text-lg text-slate-600">Join our university fairs, webinars, and info sessions.</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-12 text-center">
        <h2 className="text-xl font-semibold mb-2">No Upcoming Events</h2>
        <p className="text-slate-500">New events are being scheduled. Check back soon or follow us on social media.</p>
      </div>
    </div>
  );
}
