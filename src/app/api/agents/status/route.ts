/**
 * GET /api/agents/status — AI Agent workforce status.
 *
 * Public endpoint (no auth). Returns the 20 AI agents, their departments,
 * readiness status, and the active AI provider.
 *
 * An agent is "ready" only if its evaluation service is callable. This
 * endpoint performs a lightweight check (no actual API call) to verify
 * the agent is registered and its dependencies are available.
 */

import { AI_AGENTS, getAgentStats } from '@/lib/agents/registry';
import { ok } from '@/lib/responses';
import { withErrorHandler } from '@/lib/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    const stats = getAgentStats();
    return ok(
      {
        stats,
        agents: AI_AGENTS.map((a) => ({
          code: a.code,
          name: a.name,
          department: a.department,
          responsibility: a.responsibility,
          canAutoExecute: a.canAutoExecute,
          requiresAdminApproval: a.requiresAdminApproval,
          status: a.status,
          examScope: a.examScope,
          publicLabel: a.publicLabel,
        })),
        compliance: {
          noHumanMode: true,
          aiOptional: true,
          neverBlocksStudent: true,
          practiceOnly: true,
          disclosureText:
            'All evaluations are performed by ALO Evaluation System agents. ' +
            'External AI (Groq) is optional and falls back to local rule engine. ' +
            'ALO Academic Team Review is optional and never blocks the student report.',
        },
      },
      'AI agent status'
    );
  });
}
