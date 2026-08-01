import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/site/auth-forms";
export const metadata: Metadata = { title: "Forgot Password" };
export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Forgot Password</h1>
        <p className="text-slate-600">Enter your email to receive a reset link</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
