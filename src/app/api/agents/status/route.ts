/**
 * GET /api/agents/status — admin-only static agent registration inventory.
 *
 * This endpoint does not probe external credentials, run a controlled job, or
 * establish production readiness. Registered metadata is not proof that an
 * agent works end to end.
 */

import { requireRole } from '@/lib/auth';
import { AI_AGENTS, getAgentStats } from '@/lib/agents/registry';
import { getAiStatus } from '@/lib/ai/providers/ai-provider';
import { getProviderStatus } from '@/lib/ai/routing/ModelRouter';
import { listRubricCodes } from '@/lib/ai/evaluation/rubrics';
import { ok } from '@/lib/responses';
import { withErrorHandler } from '@/lib/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole('ADMIN', 'SUPER_ADMIN');
    const stats = getAgentStats();
    return ok(
      {
        stats,
        agents: AI_AGENTS.map((agent) => ({
          code: agent.code,
          name: agent.name,
          department: agent.department,
          responsibility: agent.responsibility,
          canAutoExecute: agent.canAutoExecute,
          requiresAdminApproval: agent.requiresAdminApproval,
          status: agent.status,
          examScope: agent.examScope,
          publicLabel: agent.publicLabel,
        })),
        evaluation: {
          // What the platform's own evaluation agent can do right now.
          ai: getAiStatus(),
          providers: getProviderStatus(),
          rubrics: listRubricCodes(),
        },
        readiness: {
          status: 'NOT_VERIFIED',
          basis: 'Static registrations only; provider health and controlled workflows were not executed by this endpoint.',
        },
      },
      'Agent registration inventory'
    );
  });
}
