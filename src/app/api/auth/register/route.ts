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

class DuplicateEmailError extends Error {}

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

    const email = parsed.data.email.trim().toLowerCase();
    const { password } = parsed.data;
    const displayName = parsed.data.name?.trim() || email.split('@')[0];

    // User, canonical Student profile, free entitlement and CRM activity are one
    // atomic unit. A failure in any write rolls the whole registration back.
    let account;
    try {
      account = await db.$transaction(async (tx) => {
        const existing = await tx.user.findUnique({ where: { email }, select: { id: true } });
        if (existing) throw new DuplicateEmailError();

        const user = await tx.user.create({
          data: {
            email,
            name: displayName,
            passwordHash: hashPassword(password),
            role: 'STUDENT',
            status: 'ACTIVE',
          },
          select: { id: true, email: true, name: true, role: true },
        });

        const student = await tx.student.create({
          data: { userId: user.id, name: displayName, email, status: 'ACTIVE' },
          select: { id: true, userId: true },
        });

        await tx.freeQuota.create({
          data: { userId: user.id, attemptsUsed: 0, attemptsLimit: 3, isAloStudent: false },
        });
        await tx.timelineEntry.create({
          data: {
            entityType: 'STUDENT',
            entityId: student.id,
            action: 'REGISTERED',
            description: 'Student account registered',
            userId: user.id,
          },
        });
        return { user, student };
      });
    } catch (error) {
      if (error instanceof DuplicateEmailError ||
          (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002')) {
        return conflict('An account with this email already exists');
      }
      throw error;
    }

    await setSessionCookie(account.user.id);
    await audit('REGISTER', { userId: account.user.id, ipAddress: ip ?? undefined, resource: 'student:' + account.student.id });

    return created(account, 'Account created successfully');
  });
}
