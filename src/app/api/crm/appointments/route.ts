/**
 * GET  /api/crm/appointments — List appointments (paginated, searchable)
 * POST /api/crm/appointments — Create a new appointments
 *
 * Auth: requires COUNSELOR role.
 */

import { createListHandler, createCreateHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  description: z.string().optional(),
  studentId: z.string().optional(),
  leadId: z.string().optional(),
  assigneeId: z.string().optional(),
  location: z.string().optional(),
});

const config = {
  entityName: 'appointments',
  roleName: 'COUNSELOR',
  createSchema,
  updateSchema: createSchema.partial(),
  searchableFields: ["title","location",],
  select: {
    id: true,
    title: true,
    startTime: true,
    endTime: true,
    status: true,
    assigneeId: true,
    createdAt: true,
  },
};

export const GET = createListHandler(config);
export const POST = createCreateHandler(config);
