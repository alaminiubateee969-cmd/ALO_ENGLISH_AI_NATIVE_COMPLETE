/**
 * GET  /api/crm/partners — List partners (paginated, searchable).
 * POST /api/crm/partners — Create a partner profile.
 *
 * Auth: requires ADMIN role.
 */

import { createListHandler, createCreateHandler } from "@/lib/crud";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  organizationName: z.string().trim().min(1).max(160),
  contactName: z.string().trim().min(1).max(100),
  email: z.string().email().max(254).optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  status: z.string().max(30).optional(),
});

const config = {
  entityName: "partners",
  roleName: "ADMIN",
  createSchema,
  updateSchema: createSchema.partial(),
  searchableFields: ["organizationName", "contactName", "email"],
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

export const GET = createListHandler(config);
export const POST = createCreateHandler(config);
