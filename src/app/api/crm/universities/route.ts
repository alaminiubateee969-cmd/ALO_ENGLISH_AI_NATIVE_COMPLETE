/**
 * GET  /api/crm/universities — List universities (paginated, searchable)
 * POST /api/crm/universities — Create a new universities
 *
 * Auth: requires ADMIN role.
 */

import { createListHandler, createCreateHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  countryId: z.string().cuid(),
  city: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  isActive: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

const config = {
  entityName: 'universities',
  roleName: 'ADMIN',
  createSchema,
  updateSchema: createSchema.partial(),
  searchableFields: ["name","city",],
  select: {
    id: true,
    name: true,
    countryId: true,
    city: true,
    website: true,
    isPublished: true,
    createdAt: true,
  },
};

export const GET = createListHandler(config);
export const POST = createCreateHandler(config);
