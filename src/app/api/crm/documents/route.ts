/**
 * GET  /api/crm/documents — List documents (paginated, searchable)
 * POST /api/crm/documents — Create a new documents
 *
 * Auth: requires COUNSELOR role.
 */

import { createListHandler, createCreateHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  applicationId: z.string().optional(),
  uploadedBy: z.string().optional(),
});

const config = {
  entityName: 'documents',
  roleName: 'COUNSELOR',
  createSchema,
  updateSchema: createSchema.partial(),
  searchableFields: ["fileName","type",],
  select: {
    id: true,
    studentId: true,
    type: true,
    fileName: true,
    fileSize: true,
    mimeType: true,
    ocrStatus: true,
    createdAt: true,
  },
};

export const GET = createListHandler(config);
export const POST = createCreateHandler(config);
