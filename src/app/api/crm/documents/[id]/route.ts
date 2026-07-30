/**
 * GET    /api/crm/documents/[id] — Get documents by ID
 * PUT    /api/crm/documents/[id] — Update documents
 * DELETE /api/crm/documents/[id] — Delete documents
 *
 * Auth: requires COUNSELOR role.
 */

import { createGetByIdHandler, createUpdateHandler, createDeleteHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  applicationId: z.string().optional(),
  uploadedBy: z.string().optional(),
}).partial();

const config = {
  entityName: 'documents',
  roleName: 'COUNSELOR',
  createSchema: updateSchema,
  updateSchema,
  searchableFields: [],
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

export const GET = createGetByIdHandler(config);
export const PUT = createUpdateHandler(config);
export const DELETE = createDeleteHandler(config);
