/**
 * src/lib/rate-limit.ts — In-memory rate limiter.
 *
 * Prevents brute-force login attempts and API abuse.
 * Uses a sliding window in local memory (sufficient for single-server).
 *
 * For multi-server deployments, replace with Redis-backed rate limiting.
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes.
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * Check rate limit for a key.
 *
 * @param key     Unique identifier (e.g., `login:${ip}` or `api:${userId}`).
 * @param limit   Max requests in the window.
 * @param windowSec  Window size in seconds.
 */
export function rateLimit(key: string, limit: number, windowSec: number): RateLimitResult {
  cleanup();
  const now = Date.now();
  const resetAt = now + windowSec * 1000;

  const existing = store.get(key);
  if (!existing || existing.resetAt < now) {
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

/** Rate limit presets. */
export const RATE_LIMITS = {
  LOGIN: { limit: 5, windowSec: 900 },       // 5 per 15 min
  REGISTER: { limit: 3, windowSec: 3600 },   // 3 per hour
  API_GENERAL: { limit: 100, windowSec: 60 }, // 100 per min
  API_MUTATING: { limit: 30, windowSec: 60 }, // 30 per min
} as const;
