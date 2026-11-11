/**
 * GET  /api/crm/users — List users (paginated, searchable)
 * POST /api/crm/users — Create a staff/partner account
 *
 * Auth: requires ADMIN role.
 *
 * POST is a dedicated handler rather than the shared createCreateHandler:
 * a User row needs a unique email and a bcrypt password hash, and the generic
 * CRUD factory has no hook for either. Creating a user through it always
 * failed with a 500 (required column missing), which made admin user
 * management unusable from the portal. This handler validates the input,
 * hashes the password with the platform's own hashPassword(), and refuses a
 * duplicate email with a 409 instead of an unhandled unique-constraint error.
 */

import { createListHandler } from '@/lib/crud';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword, requireRole } from '@/lib/auth';
import { badRequest, conflict, created, withErrorHandler } from '@/lib/responses';
import { audit, getClientIp } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STAFF_ROLES = new Set([
  'SUPER_ADMIN',
  'ADMIN',
  'HR_MANAGER',
  'BRANCH_MANAGER',
  'MARKETING_MANAGER',
  'COUNSELOR',
  'TEACHER',
  'APPLICATION_TEAM',
  'VISA_OFFICER',
  'FINANCE',
  'FRONT_DESK',
  'SUPPORT',
  'PARTNER',
  'STUDENT',
]);

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  // Minimum length mirrors the public register route so an admin cannot mint
  // an account weaker than the one a student can create for themselves.
  password: z.string().min(8).max(200),
  role: z.string().refine((value) => STAFF_ROLES.has(value), {
    message: 'Unknown role',
  }),
  phone: z.string().max(30).optional(),
  branchId: z.string().optional(),
  departmentId: z.string().optional(),
  supervisorId: z.string().optional(),
  status: z.string().max(30).optional(),
});

const listConfig = {
  entityName: 'users',
  roleName: 'ADMIN',
  // The generic create/update schemas satisfy the CrudConfig type; the list
  // handler never uses them. User creation goes through the dedicated POST
  // below (email + bcrypt hash); PATCH keeps the [id] route's own schema.
  createSchema,
  updateSchema: createSchema.partial(),
  searchableFields: ['email', 'name', 'role'],
  // Allows the management UI (and the Bill agent) to request a filtered view,
  // e.g. /api/crm/users?role=TEACHER for the Teachers screen. Values are
  // matched exactly — there is no way to probe arbitrary columns.
  filterFields: ['role', 'status'],
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
    phone: true,
    status: true,
    branchId: true,
    departmentId: true,
    createdAt: true,
  },
};

export const GET = createListHandler(listConfig);

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const actingUser = await requireRole('ADMIN', 'SUPER_ADMIN');

    const body = await req.json().catch(() => null);
    if (!body) return badRequest('Invalid JSON body');
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'Validation failed');
    }
    const { password, ...fields } = parsed.data;

    const existing = await db.user.findUnique({ where: { email: fields.email }, select: { id: true } });
    if (existing) {
      return conflict('An account with that email already exists.');
    }

    // Only the hash is stored; the plaintext never reaches the database or
    // the audit log.
    const user = await db.user.create({
      data: { ...fields, passwordHash: hashPassword(password) },
      select: listConfig.select,
    });

    await audit('USERS_CREATE', {
      userId: actingUser.id,
      resource: `users:${user.id}`,
      ipAddress: getClientIp(req),
    });
    return created(user, 'User created');
  });
}
