/**
 * GET  /api/crm/audit-logs — List audit log entries (paginated, searchable)
 *
 * Auth: requires ADMIN or SUPER_ADMIN role.
 *
 * WHY READ-ONLY
 * ──────────────
 * The audit trail is append-only (see src/lib/audit.ts). Entries are written by
 * the server as a side effect of privileged and mutating actions; exposing a
 * create/update/delete surface would let a caller rewrite history, which is the
 * one thing an audit log must prevent. Write verbs therefore answer 405.
 */

import { createListHandler } from '@/lib/crud';
import { methodNotAllowed, withErrorHandler } from '@/lib/responses';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const config = {
  entityName: 'audit-logs',
  roleName: 'ADMIN',
  createSchema: z.object({}),
  updateSchema: z.object({}),
  searchableFields: ['action', 'resource'],
  select: {
    id: true,
    userId: true,
    action: true,
    resource: true,
    ipAddress: true,
    metadata: true,
    createdAt: true,
  },
};

export const GET = createListHandler(config);

export const POST = async (): Promise<Response> =>
  withErrorHandler(async () =>
    methodNotAllowed(['GET']),
  );
