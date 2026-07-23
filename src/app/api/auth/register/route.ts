/**
 * POST /api/auth/register — Create a new student account.
 *
 * Rate limited: 3 per hour per IP.
 * Validates input with Zod.
 * Hashes password with bcrypt (cost 12).
 * Creates session cookie.
 * Audit logs the registration.
 */

import { db } from '@/lib/db';
import { hashPassword, setSessionCookie } from '@/lib/auth';
import { badRequest, conflict, created, rateLimited } from '@/lib/responses';
import { withErrorHandler } from '@/lib/responses';
import { audit, getClientIp } from '@/lib/audit';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().email('Invalid email address').max(254),
  password: z.string().min(12, 'Password must be at least 12 characters').max(128),
  name: z.string().min(1).max(100).optional(),
});

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    // Rate limit.
    const ip = getClientIp(req) || 'unknown';
    const rl = rateLimit(`register:${ip}`, RATE_LIMITS.REGISTER.limit, RATE_LIMITS.REGISTER.windowSec);
    if (!rl.allowed) {
      return rateLimited('Too many registration attempts. Please try again later.');
    }

    // Parse + validate.
    const body = await req.json().catch(() => null);
    if (!body) return badRequest('Invalid JSON body');

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'Validation failed');
    }

    const { email, password, name } = parsed.data;

    // Check for existing user.
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return conflict('An account with this email already exists');
    }

    // Create user.
    const user = await db.user.create({
      data: {
        email,
        name: name || null,
        passwordHash: hashPassword(password),
        role: 'STUDENT',
        status: 'ACTIVE',
      },
      select: { id: true, email: true, name: true, role: true },
    });

    // Set session.
    await setSessionCookie(user.id);

    // Audit log.
    await audit('REGISTER', { userId: user.id, ipAddress: ip ?? undefined, resource: 'user:' + user.id });

    return created({ user }, 'Account created successfully');
  });
}
