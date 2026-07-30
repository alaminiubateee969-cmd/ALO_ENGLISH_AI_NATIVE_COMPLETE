/**
 * GET    /api/crm/tasks/[id] — Get tasks by ID
 * PUT    /api/crm/tasks/[id] — Update tasks
 * DELETE /api/crm/tasks/[id] — Delete tasks
 *
 * Auth: requires COUNSELOR role.
 */

import { createGetByIdHandler, createUpdateHandler, createDeleteHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  description: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  assigneeId: z.string().optional(),
  leadId: z.string().optional(),
  studentId: z.string().optional(),
  applicationId: z.string().optional(),
}).partial();

const config = {
  entityName: 'tasks',
  roleName: 'COUNSELOR',
  createSchema: updateSchema,
  updateSchema,
  searchableFields: [],
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

export const GET = createGetByIdHandler(config);
export const PUT = createUpdateHandler(config);
export const DELETE = createDeleteHandler(config);
