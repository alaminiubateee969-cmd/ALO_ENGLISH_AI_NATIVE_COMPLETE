/**
 * src/lib/exam/timer.ts
 *
 * Server-authoritative exam clock.
 *
 * The browser clock is NEVER trusted. The deadline is derived from the
 * attempt's own persisted start time and duration, so changing the local
 * system clock, pausing, or reloading cannot extend an exam.
 */

export type AttemptClock = {
  serverNow: string;
  startedAt: string;
  expiresAt: string | null;
  durationSec: number;
  remainingSec: number;
  elapsedSec: number;
  expired: boolean;
};

type ClockSource = {
  startedAt: Date;
  expiresAt?: Date | null;
  durationMin?: number | null;
};

/**
 * Resolve the deadline for an attempt. Prefers the persisted `expiresAt`
 * (frozen at start) and falls back to startedAt + durationMin.
 */
export function resolveExpiry(attempt: ClockSource): Date | null {
  if (attempt.expiresAt) return attempt.expiresAt;
  if (attempt.durationMin && attempt.durationMin > 0) {
    return new Date(attempt.startedAt.getTime() + attempt.durationMin * 60_000);
  }
  return null;
}

export function computeClock(attempt: ClockSource, now: Date = new Date()): AttemptClock {
  const expiresAt = resolveExpiry(attempt);
  const durationSec = expiresAt
    ? Math.max(0, Math.round((expiresAt.getTime() - attempt.startedAt.getTime()) / 1000))
    : 0;

  const remainingSec = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000))
    : 0;
  const elapsedSec = Math.min(durationSec, Math.max(0, Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000)));

  return {
    serverNow: now.toISOString(),
    startedAt: attempt.startedAt.toISOString(),
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    durationSec,
    remainingSec,
    elapsedSec,
    expired: expiresAt ? now.getTime() >= expiresAt.getTime() : false,
  };
}

/**
 * Build the deadline for a brand new attempt.
 */
export function deadlineFor(startedAt: Date, durationMin: number): Date {
  return new Date(startedAt.getTime() + Math.max(1, durationMin) * 60_000);
}
