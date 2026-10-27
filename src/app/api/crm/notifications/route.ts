/**
 * GET  /api/crm/notifications — List notifications (paginated, searchable)
 * POST /api/crm/notifications — Create a new notifications
 *
 * Auth: requires STUDENT role.
 */

import { createListHandler, createCreateHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  userId: z.string().cuid(),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(2000),
  type: z.string().optional(),
});

const config = {
  entityName: 'notifications',
  roleName: 'STUDENT',
  createSchema,
  updateSchema: createSchema.partial(),
  searchableFields: ["title","body",],
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

export const GET = createListHandler(config);
export const POST = createCreateHandler(config);
