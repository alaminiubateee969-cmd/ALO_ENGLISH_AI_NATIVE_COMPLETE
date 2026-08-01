import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/site/auth-forms";
export const metadata: Metadata = { title: "Reset Password" };
export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
        <p className="text-slate-600">Enter your new password</p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
