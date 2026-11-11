/**
 * GET  /api/crm/tasks — List tasks (paginated, searchable)
 * POST /api/crm/tasks — Create a new tasks
 *
 * Auth: requires COUNSELOR role.
 */

import { createListHandler, createCreateHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  assigneeId: z.string().optional(),
  leadId: z.string().optional(),
  studentId: z.string().optional(),
  applicationId: z.string().optional(),
});

const config = {
  entityName: 'tasks',
  roleName: 'COUNSELOR',
  createSchema,
  updateSchema: createSchema.partial(),
  searchableFields: ["title","description",],
  select: {
    id: true,
    title: true,
    description: true,
    status: true,
    priority: true,
    dueDate: true,
    assigneeId: true,
    createdAt: true,
  },
};

export const GET = createListHandler(config);
export const POST = createCreateHandler(config);
