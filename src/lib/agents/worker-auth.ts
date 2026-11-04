import { timingSafeEqual } from "node:crypto";

/** Constant-time shared-secret check; an unset server token never authenticates. */
export function hasValidWorkerToken(request: Request): boolean {
  const expected = (process.env.AGENT_WORKER_TOKEN ?? "").trim();
  const provided = (request.headers.get("x-agent-worker-token") ?? "").trim();
  if (!expected || !provided) return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
