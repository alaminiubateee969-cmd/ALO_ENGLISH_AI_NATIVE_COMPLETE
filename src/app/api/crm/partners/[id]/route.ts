/**
 * GET    /api/crm/partners/[id] — Get partner by ID.
 * PUT    /api/crm/partners/[id] — Update a partner.
 * DELETE /api/crm/partners/[id] — Delete a partner.
 *
 * Auth: requires ADMIN role.
 */

import { createGetByIdHandler, createUpdateHandler, createDeleteHandler } from "@/lib/crud";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z.object({
  organizationName: z.string().trim().min(1).max(160).optional(),
  contactName: z.string().trim().min(1).max(100).optional(),
  email: z.string().email().max(254).optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  status: z.string().max(30).optional(),
});

const config = {
  entityName: "partners",
  roleName: "ADMIN",
  createSchema: updateSchema,
  updateSchema,
  searchableFields: [],
  select: {
    id: true,
    userId: true,
    organizationName: true,
    contactName: true,
    email: true,
    phone: true,
    status: true,
    commissionRate: true,
    referralCode: true,
    createdAt: true,
  },
};

export const GET = createGetByIdHandler(config);
export const PUT = createUpdateHandler(config);
export const DELETE = createDeleteHandler(config);
