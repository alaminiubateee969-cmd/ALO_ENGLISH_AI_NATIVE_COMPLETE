import type { Metadata } from "next";
import { RegisterForm } from "@/components/site/auth-forms";
export const metadata: Metadata = { title: "Register" };
export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Account</h1>
        <p className="text-slate-600">Register as a student to get started</p>
      </div>
      <RegisterForm />
    </div>
  );
}
