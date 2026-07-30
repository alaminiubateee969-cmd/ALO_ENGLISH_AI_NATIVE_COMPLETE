/**
 * GET    /api/crm/leads/[id] — Get leads by ID
 * PUT    /api/crm/leads/[id] — Update leads
 * DELETE /api/crm/leads/[id] — Delete leads
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
  source: z.string().optional(),
  country: z.string().optional(),
  courseInterest: z.string().optional(),
  intake: z.string().optional(),
  budgetRange: z.string().optional(),
  englishStatus: z.string().optional(),
  branchId: z.string().optional(),
  counselorId: z.string().optional(),
  partnerId: z.string().optional(),
  notes: z.string().optional(),
}).partial();

const config = {
  entityName: 'leads',
  roleName: 'COUNSELOR',
  createSchema: updateSchema,
  updateSchema,
  searchableFields: [],
  select: {
    id: true,
    name: true,
    email: true,
    phone: true,
    source: true,
    status: true,
    country: true,
    courseInterest: true,
    createdAt: true,
  },
};

export const GET = createGetByIdHandler(config);
export const PUT = createUpdateHandler(config);
export const DELETE = createDeleteHandler(config);
