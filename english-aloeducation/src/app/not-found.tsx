import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-alo-soft-gray px-4 text-center">
      <div className="max-w-md">
        <p className="text-7xl font-bold text-alo-navy">404</p>
        <h1 className="mt-4 text-2xl font-bold text-alo-navy">Page not found</h1>
        <p className="mt-2 text-alo-muted">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
          have been moved, deleted, or never existed.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-alo-orange px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
          >
            Go home
          </Link>
          <Link
            href="/contact"
            className="rounded-lg bg-white px-6 py-3 font-semibold text-alo-navy ring-1 ring-alo-card transition hover:bg-alo-soft-blue"
          >
            Contact support
          </Link>
        </div>
      </div>
    </main>
  );
}
