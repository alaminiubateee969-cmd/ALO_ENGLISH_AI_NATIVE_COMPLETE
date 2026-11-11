/**
 * GET /api/linkis/health — Linkis gateway health probe (opt-in)
 *
 * Returns { enabled:false } when LINKIS_ENABLED != "true" so Hostinger
 * stays green without a Linkis cluster. When enabled, proxies to
 * Linkis Gateway /api/rest_j/v1/linkisManager/ecinfo as a liveness check.
 * Protected: ADMIN only when enabled to avoid leaking infra details.
 */

import { getLinkisConfig, isLinkisEnabled } from "@/lib/linkis/config";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = getLinkisConfig();

  if (!cfg.enabled) {
    return Response.json(
      {
        enabled: false,
        configured: false,
        gatewayUrl: null,
        message: "Linkis integration is disabled. Set LINKIS_ENABLED=true, LINKIS_GATEWAY_URL and LINKIS_TOKEN to enable.",
        docs: "/docs/LINKIS_INTEGRATION.md",
        upstream: "https://github.com/apache/linkis",
      },
      { status: 200 }
    );
  }

  // When enabled, require auth to avoid exposing gateway details
  const user = await getCurrentUser().catch(() => null);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "SUPER_ADMIN"].includes((user as { role?: string }).role || "")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!cfg.gatewayUrl || !cfg.token) {
    return Response.json({ enabled: true, healthy: false, reason: "LINKIS_GATEWAY_URL or LINKIS_TOKEN missing" }, { status: 503 });
  }

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`${cfg.gatewayUrl}/api/rest_j/v1/linkisManager/ecinfo`, {
      headers: { "Token-Code": cfg.token },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    const text = await res.text();
    return Response.json(
      {
        enabled: true,
        healthy: res.ok,
        status: res.status,
        gatewayUrl: cfg.gatewayUrl,
        defaultEngine: cfg.defaultEngine,
        response: text.slice(0, 2000),
      },
      { status: res.ok ? 200 : 503 }
    );
  } catch (e) {
    return Response.json(
      { enabled: true, healthy: false, gatewayUrl: cfg.gatewayUrl, error: String(e) },
      { status: 503 }
    );
  }
}
