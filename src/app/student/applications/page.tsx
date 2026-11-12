import { Suspense } from "react";
import ApplicationsClient from "./ApplicationsClient";

export const dynamic = "force-dynamic";

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-12 text-center text-slate-400">Loading application...</div>}>
      <ApplicationsClient />
    </Suspense>
  );
}
