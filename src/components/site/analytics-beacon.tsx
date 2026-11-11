"use client";

/**
 * src/components/site/analytics-beacon.tsx
 *
 * Sends one page view per navigation, and nothing else about the visitor.
 *
 * DESIGN NOTES
 * ────────────
 *   * **No cookies, no local storage, no visitor id.** Nothing is read from or
 *     written to the browser beyond the current path, so there is nothing to
 *     consent to under most cookie rules and nothing to expire.
 *   * **It sends after paint**, so the request never competes with rendering, and
 *     it batches nothing across navigations — one small POST per page.
 *   * **It fails silently.** Analytics must never produce an error a visitor can
 *     see, and must never break a page if the endpoint is down; the request is
 *     fire-and-forget with a caught rejection.
 *   * **`keepalive`** so a navigation away does not cancel the request.
 *
 * The path arrives here through `usePathname`, which is the route only: query
 * strings (which routinely carry tokens and email addresses) are never part of
 * it, and the server refuses them anyway (see src/lib/analytics/events.ts).
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Fire-and-forget event. Exported so a call to action can count a click without
 * importing a vendor SDK: `track("cta_click", "hero-consultation")`.
 */
export function track(event: string, label?: string): void {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({
    events: [{ name: event, path: window.location.pathname, label }],
  });

  try {
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // A blocked or unavailable endpoint is not a page failure.
  }
}

export function AnalyticsBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    // Private areas are not measured: a staff screen has no visitor to count, and
    // a student's own dashboard is their business rather than a page statistic.
    if (/^\/(?:admin|employee|student|partner|super-admin|portals|login|register|reset-password|forgot-password)/.test(pathname)) {
      return;
    }
    track("page_view");
  }, [pathname]);

  return null;
}
