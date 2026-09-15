/**
 * POST /api/auth/login — Authenticate a user.
 *
 * Rate limited: 5 per 15 min per IP.
 * Validates input, checks credentials, creates session.
 * Audit logs success AND failure (for security monitoring).
 */

import { db } from '@/lib/db';
import { verifyPassword, setSessionCookie, AuthError } from '@/lib/auth';
import { badRequest, ok, rateLimited, unauthorized, internalError } from '@/lib/responses';
import { audit, getClientIp } from '@/lib/audit';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { withErrorHandler } from '@/lib/responses';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    // Rate limit.
    const ip = getClientIp(req) || 'unknown';
    const rl = rateLimit(`login:${ip}`, RATE_LIMITS.LOGIN.limit, RATE_LIMITS.LOGIN.windowSec);
    if (!rl.allowed) {
      return rateLimited('Too many login attempts. Please try again in 15 minutes.');
    }

    // Parse + validate.
    const body = await req.json().catch(() => null);
    if (!body) return badRequest('Invalid JSON body');

    const schema = z.object({
      email: z.string().email().max(254),
      password: z.string().min(1).max(128),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'Validation failed');
    }

    const { email, password } = parsed.data;

    // Find user.
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      await audit('LOGIN_FAILED', { ipAddress: ip, resource: 'email:' + email });
      return unauthorized('Invalid email or password');
    }

    // Verify password.
    if (!verifyPassword(password, user.passwordHash)) {
      await audit('LOGIN_FAILED', { userId: user.id, ipAddress: ip, resource: 'email:' + email });
      return unauthorized('Invalid email or password');
    }

    // Check status.
    if (user.status !== 'ACTIVE') {
      await audit('LOGIN_FAILED', { userId: user.id, ipAddress: ip, resource: 'status:' + user.status });
      return unauthorized('Account is suspended. Contact support.');
    }

    // Set session.
    await setSessionCookie(user.id);

    // Update lastLoginAt + create a Session record (for revocation tracking)
    const userAgent = req.headers.get('user-agent') || null;
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {}); // Non-critical — don't fail login if this errors

    // Audit log.
    await audit('LOGIN_SUCCESS', { userId: user.id, ipAddress: ip });

    return ok(
      { user: { id: user.id, email: user.email, name: user.name, role: user.role } },
      'Login successful'
    );
  });
}
