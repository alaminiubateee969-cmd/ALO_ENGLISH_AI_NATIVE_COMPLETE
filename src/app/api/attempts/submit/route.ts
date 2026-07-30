/**
 * POST /api/attempts/submit — Submit a practice attempt for AI evaluation.
 *
 * Requires authentication (STUDENT role).
 * Validates ownership (user can only submit their own attempt).
 *
 * This route invokes the Exam Conductor Agent (AGENT-CONDUCT-01), which
 * orchestrates the Writing, Speaking, and Interview evaluation agents.
 * The agents use a rule-based engine (local_rule_engine) by default, and
 * optionally refine scores via Groq AI when GROQ_API_KEY is configured.
 *
 * Audit logs the submission + score generation.
 */

import { requireAuth } from '@/lib/auth';
import { ok, badRequest, notFound, forbidden } from '@/lib/responses';
import { withErrorHandler } from '@/lib/responses';
import { audit, getClientIp } from '@/lib/audit';
import { conductExam } from '@/lib/agents/ExamConductorAgent';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  attemptId: z.string().cuid(),
  answers: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();

    const body = await req.json().catch(() => null);
    if (!body) return badRequest('Invalid JSON body');

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'Validation failed');
    }

    const { attemptId, answers } = parsed.data;

    // Verify ownership.
    // (conductExam also checks, but we want to return 403 before any evaluation runs)
    const { db } = await import('@/lib/db');
    const attempt = await db.attempt.findUnique({ where: { id: attemptId }, select: { userId: true, status: true } });
    if (!attempt) return notFound('Attempt not found');
    if (attempt.userId !== user.id) return forbidden('You can only submit your own attempt');
    if (attempt.status === 'SUBMITTED' || attempt.status === 'SCORED') {
      return badRequest('Attempt already submitted');
    }

    // Run the Exam Conductor Agent — orchestrates all evaluation agents.
    const result = await conductExam(attemptId, answers || {});

    // Audit log.
    const ip = getClientIp(req);
    await audit('EXAM_SUBMIT', {
      userId: user.id,
      resource: 'attempt:' + attemptId,
      ipAddress: ip,
      metadata: { overall: result.overall, provider: result.providerUsed, confidence: result.confidence },
    });

    await audit('SCORE_GENERATED', {
      userId: user.id,
      resource: 'score:' + attemptId,
      metadata: {
        provider: result.providerUsed,
        fallback: result.fallbackUsed,
        confidence: result.confidence,
        reviewRecommendation: result.reviewRecommendation,
      },
    });

    return ok({ attempt: { id: attemptId, status: result.status }, result }, 'Exam evaluated by AI agents');
  });
}
