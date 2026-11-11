/**
 * src/lib/linkis/config.ts — Linkis integration configuration
 *
 * Apache Linkis (https://github.com/apache/linkis) is a computation
 * middleware between upper apps (ALO Next.js) and underlying engines
 * (Spark, Hive, Python, Shell, JDBC, Flink, etc.).
 *
 * This module is OPT-IN. All helpers return `disabled` when LINKIS_ENABLED != "true",
 * so CI, Hostinger, and local dev work without a Linkis cluster.
 *
 * Required env when enabled (set in panel / .env, never committed):
 *   LINKIS_ENABLED=true
 *   LINKIS_GATEWAY_URL=http://linkis-gateway:9001  # Spring Cloud Gateway
 *   LINKIS_TOKEN=...                                # Token-Code from gateway
 *   LINKIS_DEFAULT_ENGINE=spark-3.2.1               # or python, shell, jdbc
 */

export type LinkisConfig = {
  enabled: boolean;
  gatewayUrl: string;
  token: string;
  defaultEngine: string;
  timeoutMs: number;
};

export function getLinkisConfig(): LinkisConfig {
  const enabled = process.env.LINKIS_ENABLED === "true";
  const gatewayUrl = (process.env.LINKIS_GATEWAY_URL || "").replace(/\/$/, "");
  const token = process.env.LINKIS_TOKEN || "";
  const defaultEngine = process.env.LINKIS_DEFAULT_ENGINE || "spark-3.2.1";
  const timeoutMs = parseInt(process.env.LINKIS_TIMEOUT_MS || "30000", 10);
  return { enabled, gatewayUrl, token, defaultEngine, timeoutMs };
}

export function isLinkisEnabled(): boolean {
  const c = getLinkisConfig();
  return c.enabled && Boolean(c.gatewayUrl) && Boolean(c.token);
}

export function assertLinkisEnabled(): void {
  const c = getLinkisConfig();
  if (!c.enabled) throw new Error("Linkis is disabled. Set LINKIS_ENABLED=true to use it.");
  if (!c.gatewayUrl) throw new Error("LINKIS_GATEWAY_URL is not set.");
  if (!c.token) throw new Error("LINKIS_TOKEN is not set.");
}
