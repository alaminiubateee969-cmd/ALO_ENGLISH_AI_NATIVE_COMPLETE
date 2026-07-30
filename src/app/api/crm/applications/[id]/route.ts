/**
 * GET    /api/crm/applications/[id] — Get applications by ID
 * PUT    /api/crm/applications/[id] — Update applications
 * DELETE /api/crm/applications/[id] — Delete applications
 *
 * Auth: requires COUNSELOR role.
 */

import { createGetByIdHandler, createUpdateHandler, createDeleteHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  intake: z.string().optional(),
  status: z.string().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
}).partial();

const config = {
  entityName: 'applications',
  roleName: 'COUNSELOR',
  createSchema: updateSchema,
  updateSchema,
  searchableFields: [],
  select: {
    id: true,
    studentId: true,
    courseId: true,
    intake: true,
    status: true,
    createdAt: true,
  },
};

export const GET = createGetByIdHandler(config);
export const PUT = createUpdateHandler(config);
export const DELETE = createDeleteHandler(config);
