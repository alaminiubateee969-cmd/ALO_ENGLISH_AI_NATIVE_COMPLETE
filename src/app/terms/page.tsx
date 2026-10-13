import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use ALO Education practice material, guidance and portals, including what practice results do and do not establish.",
};
export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose prose-slate">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().getFullYear()}</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
      <p className="text-slate-700">By using ALO Education services, you agree to these terms.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">2. Services</h2>
      <p className="text-slate-700">We provide study abroad consultancy, university application assistance, visa guidance, and test preparation.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">3. User Responsibilities</h2>
      <p className="text-slate-700">You must provide accurate information, maintain account security, and not misuse the platform.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">4. Limitation of Liability</h2>
      <p className="text-slate-700">We are not liable for university admission decisions, visa outcomes, or third-party actions.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">5. Contact</h2>
      <p className="text-slate-700">For questions about these terms, contact legal@aloeducation.com.</p>
    </div>
  );
}
