/**
 * GET  /api/crm/applications — List applications (paginated, searchable)
 * POST /api/crm/applications — Create a new applications
 *
 * Auth: requires COUNSELOR role.
 */

import { createListHandler, createCreateHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  intake: z.string().optional(),
  status: z.string().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

const config = {
  entityName: 'applications',
  roleName: 'COUNSELOR',
  createSchema,
  updateSchema: createSchema.partial(),
  searchableFields: ["status",],
  select: {
    id: true,
    studentId: true,
    courseId: true,
    intake: true,
    status: true,
    createdAt: true,
  },
};

export const GET = createListHandler(config);
export const POST = createCreateHandler(config);
