/**
 * GET    /api/crm/audit-logs/[id] — Get a single audit log entry
 *
 * Auth: requires ADMIN or SUPER_ADMIN role.
 *
 * The audit trail is append-only (see src/lib/audit.ts), so PUT and DELETE
 * answer 405 rather than mutating history.
 */

import { createGetByIdHandler } from '@/lib/crud';
import { methodNotAllowed, withErrorHandler } from '@/lib/responses';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const config = {
  entityName: 'audit-logs',
  roleName: 'ADMIN',
  createSchema: z.object({}),
  updateSchema: z.object({}),
  searchableFields: [],
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

export const GET = createGetByIdHandler(config);

export const PUT = async (): Promise<Response> =>
  withErrorHandler(async () =>
    methodNotAllowed(['GET']),
  );

export const DELETE = async (): Promise<Response> =>
  withErrorHandler(async () =>
    methodNotAllowed(['GET']),
  );
