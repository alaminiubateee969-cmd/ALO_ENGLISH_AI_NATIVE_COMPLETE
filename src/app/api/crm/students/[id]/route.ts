/**
 * GET    /api/crm/students/[id] — Get students by ID
 * PUT    /api/crm/students/[id] — Update students
 * DELETE /api/crm/students/[id] — Delete students
 *
 * Auth: requires COUNSELOR role.
 */

import { createGetByIdHandler, createUpdateHandler, createDeleteHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
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
}).partial();

const config = {
  entityName: 'students',
  roleName: 'COUNSELOR',
  createSchema: updateSchema,
  updateSchema,
  searchableFields: [],
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

export const GET = createGetByIdHandler(config);
export const PUT = createUpdateHandler(config);
export const DELETE = createDeleteHandler(config);
