/**
 * GET  /api/crm/leads — List leads (paginated, searchable)
 * POST /api/crm/leads — Create a new leads
 *
 * Auth: requires COUNSELOR role.
 */

import { createListHandler, createCreateHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional(),
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
});

const config = {
  entityName: 'leads',
  roleName: 'COUNSELOR',
  createSchema,
  updateSchema: createSchema.partial(),
  searchableFields: ["name","email","phone",],
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

export const GET = createListHandler(config);
export const POST = createCreateHandler(config);
