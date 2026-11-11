/**
 * src/lib/auth.ts — Authentication utilities.
 *
 * Provides:
 *   - Password hashing (bcrypt, cost 12)
 *   - Password verification
 *   - Session token creation/verification (HMAC-signed, stateless)
 *   - Current user retrieval (from cookie)
 *   - Role-based access check helper
 *
 * This is a lightweight, dependency-free session system (no NextAuth
 * complexity for this deployment). Tokens are HMAC-signed and stored in
 * an HTTP-only cookie.
 */

import { compareSync, hashSync } from 'bcryptjs';
import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { db } from './db';

const COOKIE_NAME = 'alo_session';
const TOKEN_TTL_SECONDS = 86400; // 24 hours

/** Hash a password with bcrypt (cost from env, default 12). */
export function hashPassword(password: string): string {
  const cost = parseInt(process.env.BCRYPT_COST || '12', 10);
  return hashSync(password, Math.min(Math.max(cost, 10), 14));
}

/** Verify a password against a hash. */
export function verifyPassword(password: string, hash: string): boolean {
  try {
    return compareSync(password, hash);
  } catch {
    return false;
  }
}

/** Create an HMAC-signed session token. Format: userId.expiry.signature */
export function createSessionToken(userId: string): string {
  const secret = process.env.AUTH_SECRET || '';
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be set and at least 32 characters');
  }
  const expiry = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = `${userId}.${expiry}`;
  const signature = createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

/** Verify an HMAC-signed session token. Returns userId or null. */
export function verifySessionToken(token: string): string | null {
  const secret = process.env.AUTH_SECRET || '';
  if (!secret || secret.length < 32) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, expiryStr, signature] = parts;

  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry) || expiry < Math.floor(Date.now() / 1000)) return null;

  const payload = `${userId}.${expiry}`;
  const expectedSignature = createHmac('sha256', secret).update(payload).digest('hex');

  // Timing-safe comparison to prevent timing attacks.
  try {
    const a = Buffer.from(signature, 'hex');
    const b = Buffer.from(expectedSignature, 'hex');
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return userId;
}

/** Set the session cookie in the response. */
export async function setSessionCookie(userId: string): Promise<void> {
  const token = createSessionToken(userId);
  const isProduction = process.env.NODE_ENV === 'production';
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS,
  });
}

/** Clear the session cookie. */
export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Get the current user from the session cookie. Returns null if not authenticated. */
export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const userId = verifySessionToken(token);
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, status: true, branchId: true },
  });

  if (!user || user.status !== 'ACTIVE') return null;
  return user;
}

/** Require authentication. Throws if not authenticated. */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError('Authentication required', 401);
  }
  return user;
}

/** Require a specific role. Throws if insufficient. */
export async function requireRole(...roles: string[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new AuthError('Insufficient permissions', 403);
  }
  return user;
}

/** Custom auth error with status code. */
export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export { COOKIE_NAME };
