/**
 * GET    /api/crm/appointments/[id] — Get appointments by ID
 * PUT    /api/crm/appointments/[id] — Update appointments
 * DELETE /api/crm/appointments/[id] — Delete appointments
 *
 * Auth: requires COUNSELOR role.
 */

import { createGetByIdHandler, createUpdateHandler, createDeleteHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  description: z.string().optional(),
  studentId: z.string().optional(),
  leadId: z.string().optional(),
  assigneeId: z.string().optional(),
  location: z.string().optional(),
}).partial();

const config = {
  entityName: 'appointments',
  roleName: 'COUNSELOR',
  createSchema: updateSchema,
  updateSchema,
  searchableFields: [],
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

export const GET = createGetByIdHandler(config);
export const PUT = createUpdateHandler(config);
export const DELETE = createDeleteHandler(config);
