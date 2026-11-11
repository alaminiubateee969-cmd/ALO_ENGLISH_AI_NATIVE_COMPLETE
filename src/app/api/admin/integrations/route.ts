/**
 * GET /api/admin/integrations — what this deployment is connected to.
 *
 * Answers the operator's question in one request: which external services are
 * configured, which are not, and what stops working because of it. Values are
 * never returned — only variable names — so the response is safe to paste into a
 * runbook or an incident channel.
 *
 * Auth: ADMIN or SUPER_ADMIN.
 */

import { requireRole } from '@/lib/auth';
import { ok, withErrorHandler } from '@/lib/responses';
import { INTEGRATIONS, integrationReport, summariseIntegrations } from '@/lib/integrations/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole('ADMIN', 'SUPER_ADMIN');

    const rows = integrationReport();
    const byId = new Map(INTEGRATIONS.map((integration) => [integration.id, integration]));

    return ok({
      // The licence and copying policy travel with every row: an operator adding a
      // credential should see, in the same payload, whether the service may be
      // vendored or only called.
      integrations: rows.map((row) => ({
        ...row,
        licence: byId.get(row.id)?.licence ?? null,
        copying: byId.get(row.id)?.copying ?? null,
        projectUrl: byId.get(row.id)?.projectUrl ?? null,
        implementedIn: byId.get(row.id)?.implementedIn ?? null,
        hasFirstPartyFallback: byId.get(row.id)?.hasFirstPartyFallback ?? false,
      })),
      summary: summariseIntegrations(rows),
    });
  });
}
