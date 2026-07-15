"use client";

import { useEffect } from "react";

/**
 * Root error boundary. Catches unhandled errors thrown by any route
 * segment and shows a friendly recovery UI.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this would forward to Sentry / Datadog.
    console.error("[app/error]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-alo-soft-gray px-4 text-center">
      <div className="max-w-md">
        <p className="text-6xl">⚠️</p>
        <h1 className="mt-4 text-2xl font-bold text-alo-navy">
          Something went wrong
        </h1>
        <p className="mt-2 text-alo-muted">
          An unexpected error occurred while loading this page. Please try
          again — if the problem persists, contact our support team.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-alo-faint">
            Error ID: {error.digest}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-alo-orange px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-lg bg-white px-6 py-3 font-semibold text-alo-navy ring-1 ring-alo-card transition hover:bg-alo-soft-blue"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
