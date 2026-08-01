import type { Metadata } from "next";
import { LoginForm } from "@/components/site/auth-forms";
export const metadata: Metadata = { title: "Login" };
export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
        <p className="text-slate-600">Login to your ALO Education account</p>
      </div>
      <LoginForm />
    </div>
  );
}
