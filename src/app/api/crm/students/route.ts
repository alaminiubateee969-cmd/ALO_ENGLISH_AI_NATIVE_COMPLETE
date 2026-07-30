/**
 * GET  /api/crm/students — List students (paginated, searchable)
 * POST /api/crm/students — Create a new students
 *
 * Auth: requires COUNSELOR role.
 */

import { createListHandler, createCreateHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  nationality: z.string().optional(),
  passportNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  branchId: z.string().optional(),
  counselorId: z.string().optional(),
  partnerId: z.string().optional(),
});

const config = {
  entityName: 'students',
  roleName: 'COUNSELOR',
  createSchema,
  updateSchema: createSchema.partial(),
  searchableFields: ["name","email","phone",],
  select: {
    id: true,
    name: true,
    email: true,
    phone: true,
    nationality: true,
    status: true,
    createdAt: true,
  },
};

export const GET = createListHandler(config);
export const POST = createCreateHandler(config);
