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
  title: z.string().min(1).max(200),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  description: z.string().max(2000).optional(),
  studentId: z.string().optional(),
  leadId: z.string().optional(),
  assigneeId: z.string().optional(),
  location: z.string().max(300).optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  description: z.string().max(2000).optional(),
  studentId: z.string().optional(),
  leadId: z.string().optional(),
  assigneeId: z.string().optional(),
  location: z.string().max(300).optional(),
}).partial();

const config = {
  entityName: 'appointments',
  roleName: 'COUNSELOR',
  createSchema,
  updateSchema,
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
