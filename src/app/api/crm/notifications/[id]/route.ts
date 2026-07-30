/**
 * GET    /api/crm/notifications/[id] — Get notifications by ID
 * PUT    /api/crm/notifications/[id] — Update notifications
 * DELETE /api/crm/notifications/[id] — Delete notifications
 *
 * Auth: requires STUDENT role.
 */

import { createGetByIdHandler, createUpdateHandler, createDeleteHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  type: z.string().optional(),
}).partial();

const config = {
  entityName: 'notifications',
  roleName: 'STUDENT',
  createSchema: updateSchema,
  updateSchema,
  searchableFields: [],
  select: {
    id: true,
    userId: true,
    title: true,
    body: true,
    type: true,
    readAt: true,
    createdAt: true,
  },
};

export const GET = createGetByIdHandler(config);
export const PUT = createUpdateHandler(config);
export const DELETE = createDeleteHandler(config);
