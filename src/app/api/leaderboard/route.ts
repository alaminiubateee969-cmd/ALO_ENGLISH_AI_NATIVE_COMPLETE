/**
 * GET /api/leaderboard — Public leaderboard of top practice scores.
 *
 * Returns the top 50 students by `Score.overall` descending. Each row is the
 * candidate's BEST single attempt (a candidate with multiple submitted
 * attempts only appears once, with their highest score).
 *
 * Disclosure:
 *   Scores shown here are PRACTICE INDICATORS produced by the platform's own
 *   objective scorer — they are not issued, endorsed or validated by any exam
 *   provider. The route never returns an official-looking grade, only the
 *   numeric `overall` field stored on the Score row. The leaderboard page is
 *   responsible for the "practice only" disclosure text.
 *
 * PII:
 *   A candidate's display name is shown if their `User.name` is set.
 *   Otherwise a masked email handle is returned (e.g. `r***@example.com`)
 *   so a nameless account is not a row of dots. Email is never returned in
 *   full.
 *
 * Public route — no auth required. Rate-limited per IP (60/min) to discourage
 * scraping.
 */

import { db } from "@/lib/db";
import { ok, rateLimited, withErrorHandler } from "@/lib/responses";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 50;

/** Mask an email as `r***@example.com` — first char + domain only. */
function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "anonymous";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const head = local.charAt(0) || "u";
  return `${head}***@${domain}`;
}

export async function GET(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    // Public route — rate limit per IP to discourage scraping.
    const ip = getClientIp(req) || "unknown";
    const rl = rateLimit(
      `leaderboard:${ip}`,
      RATE_LIMITS.API_GENERAL.limit,
      RATE_LIMITS.API_GENERAL.windowSec,
    );
    if (!rl.allowed) {
      return rateLimited("Too many requests. Please slow down.");
    }

    // Pull the top N scores with their attempt + exam type joins. We read all
    // candidate rows then collapse to one-per-user on the server so the
    // "best single attempt" rule is exact and not approximated by a GROUP BY
    // (Prisma's groupBy cannot return joined columns on SQLite).
    //
    // We fetch 5x the limit so a candidate with many attempts near the top
    // does not push a lower-ranked candidate out of view after collapsing.
    const rows = await db.score.findMany({
      orderBy: { overall: "desc" },
      take: LIMIT * 5,
      select: {
        id: true,
        overall: true,
        listening: true,
        reading: true,
        writing: true,
        speaking: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, email: true },
        },
        attempt: {
          select: {
            id: true,
            submittedAt: true,
            practiceSet: {
              select: {
                examType: { select: { code: true, name: true } },
              },
            },
          },
        },
      },
    });

    // Collapse to one row per user — keep the first occurrence (highest
    // overall since rows are sorted desc).
    const seen = new Set<string>();
    const ranked = rows
      .filter((r) => {
        if (seen.has(r.user.id)) return false;
        seen.add(r.user.id);
        return true;
      })
      .slice(0, LIMIT)
      .map((r, i) => {
        const rank = i + 1;
        const name =
          r.user.name && r.user.name.trim().length > 0
            ? r.user.name.trim()
            : maskEmail(r.user.email);
        return {
          rank,
          userId: r.user.id,
          name,
          // Exam type code + human name from the attempt's practice set.
          examType: r.attempt.practiceSet.examType
            ? {
                code: r.attempt.practiceSet.examType.code,
                name: r.attempt.practiceSet.examType.name,
              }
            : null,
          score: {
            overall: r.overall,
            listening: r.listening,
            reading: r.reading,
            writing: r.writing,
            speaking: r.speaking,
          },
          // The date the score was generated (server-authoritative).
          date: r.createdAt,
          attemptId: r.attempt.id,
        };
      });

    return ok(
      {
        leaderboard: ranked,
        total: ranked.length,
        limit: LIMIT,
        disclosure:
          "Scores are practice indicators produced by the platform's own objective scorer. They are not issued, endorsed or validated by any exam provider.",
      },
      "Top practice scores retrieved",
    );
  });
}
