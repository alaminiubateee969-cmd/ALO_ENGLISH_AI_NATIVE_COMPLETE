import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How ALO Education collects, uses and keeps personal information, what we never do with it, and how to ask us to correct or remove it.",
};
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose prose-slate">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().getFullYear()}</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">1. Information We Collect</h2>
      <p className="text-slate-700">We collect information you provide directly: name, email, phone, academic history, and documents needed for applications.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">2. How We Use Your Information</h2>
      <p className="text-slate-700">We use your information to process university applications, provide counseling, communicate with you, and comply with legal obligations.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">3. Data Security</h2>
      <p className="text-slate-700">We use bcrypt password hashing, HTTPS encryption, RBAC access control, and audit logging to protect your data.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Retention</h2>
      <p className="text-slate-700">We retain your data for as long as your account is active or as needed to provide services. Audit logs are retained for 365 days.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">5. Your Rights</h2>
      <p className="text-slate-700">You have the right to access, correct, or delete your personal data. Contact us at privacy@aloeducation.com.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">6. Cookies</h2>
      <p className="text-slate-700">We use essential cookies for authentication. See our Cookie Policy for details.</p>
    </div>
  );
}
