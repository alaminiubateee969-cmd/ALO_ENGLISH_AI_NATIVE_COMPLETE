/**
 * GET /api/agents/status — admin-only static agent registration inventory.
 *
 * This endpoint does not probe external credentials, run a controlled job, or
 * establish production readiness. Registered metadata is not proof that an
 * agent works end to end.
 */

import { requireRole } from '@/lib/auth';
import { AI_AGENTS, getAgentStats } from '@/lib/agents/registry';
import { MARKETING_SKILLS, getSkillStats } from '@/lib/agents/skills';
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
        // Reviewed skill packs (inputs, steps, guardrails, output sections).
        // Registered metadata only — none of these has been executed against a
        // provider, so they are reported separately from agent readiness.
        skills: MARKETING_SKILLS.map((skill) => ({
          id: skill.id,
          name: skill.name,
          owner: skill.owner,
          purpose: skill.purpose,
          canAutoExecute: skill.canAutoExecute,
          status: skill.status,
          guardrailCount: skill.guardrails.length,
          stepCount: skill.steps.length,
        })),
        skillStats: getSkillStats(),
        readiness: {
          status: 'NOT_VERIFIED',
          basis: 'Static registrations only; provider health and controlled workflows were not executed by this endpoint.',
        },
      },
      'Agent registration inventory'
    );
  });
}
