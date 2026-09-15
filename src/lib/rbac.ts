/**
 * src/lib/rbac.ts
 *
 * RBAC (Role-Based Access Control) + Multi-Tenancy helpers.
 *
 * Builds on the existing auth.ts session system to add:
 *   - Fine-grained permissions (not just role strings)
 *   - Team membership + team-scoped access
 *   - Permission checks per resource
 *
 * Usage in API routes:
 *   const user = await requireSession();
 *   await requirePermission(user, "leads.view");
 *   await requireTeamAccess(user, teamId);
 */

import { db } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
};

export type TeamMembership = {
  teamId: string;
  roleId: string;
  roleSlug: string;
  teamName: string;
};

// ─── Session Helpers (wrap existing auth.ts) ──────────────────────────────

export async function requireSession(): Promise<AuthenticatedUser> {
  return requireAuth();
}

export async function requireUser(): Promise<AuthenticatedUser> {
  return requireAuth();
}

// ─── Role-Based Access ────────────────────────────────────────────────────

/**
 * Require that the user has one of the specified system-level roles.
 * System roles are the legacy role strings on the User model
 * (SUPER_ADMIN, ADMIN, MANAGER, COUNSELLOR, etc.)
 */
export async function requireRole(
  ...roles: string[]
): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new AuthError("Insufficient role permissions", 403);
  }
  return user;
}

/**
 * Require that the user is a SUPER_ADMIN.
 */
export async function requireSuperAdmin(): Promise<AuthenticatedUser> {
  return requireRole("SUPER_ADMIN");
}

// ─── Permission-Based Access (RBAC tables) ────────────────────────────────

/**
 * Cache of user permissions to avoid repeated DB queries.
 * Keyed by userId, expires after 60 seconds.
 */
const permissionCache = new Map<string, { permissions: Set<string>; expires: number }>();
const CACHE_TTL_MS = 60_000;

/**
 * Get all permissions for a user (from all team memberships).
 * Results are cached for 60 seconds.
 */
export async function getUserPermissions(userId: string): Promise<Set<string>> {
  // Check cache
  const cached = permissionCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return cached.permissions;
  }

  // Query: user → teamMembers → role → rolePermissions → permission
  const memberships = await db.teamMember.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  const permissions = new Set<string>();
  for (const membership of memberships) {
    for (const rp of membership.role.permissions) {
      permissions.add(rp.permission.key);
    }
  }

  // Cache the result
  permissionCache.set(userId, {
    permissions,
    expires: Date.now() + CACHE_TTL_MS,
  });

  return permissions;
}

/**
 * Invalidate the permission cache for a user.
 * Call this when roles/permissions change.
 */
export function invalidatePermissionCache(userId: string): void {
  permissionCache.delete(userId);
}

/**
 * Require that the user has a specific permission.
 * Checks both system roles (SUPER_ADMIN has all) and RBAC permissions.
 */
export async function requirePermission(
  user: AuthenticatedUser,
  permission: string
): Promise<void> {
  // SUPER_ADMIN and ADMIN bypass permission checks (have all permissions)
  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
    return;
  }

  const userPermissions = await getUserPermissions(user.id);
  if (!userPermissions.has(permission)) {
    throw new AuthError(`Permission denied: ${permission} required`, 403);
  }
}

/**
 * Check if a user has a permission (non-throwing version).
 */
export async function hasPermission(
  user: AuthenticatedUser,
  permission: string
): Promise<boolean> {
  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
    return true;
  }
  const userPermissions = await getUserPermissions(user.id);
  return userPermissions.has(permission);
}

// ─── Team-Based Access (Multi-Tenancy) ────────────────────────────────────

/**
 * Get all teams a user belongs to.
 */
export async function getUserTeams(userId: string): Promise<TeamMembership[]> {
  const memberships = await db.teamMember.findMany({
    where: { userId },
    include: {
      team: true,
      role: true,
    },
  });

  return memberships.map((m) => ({
    teamId: m.teamId,
    roleId: m.roleId,
    roleSlug: m.role.slug,
    teamName: m.team.name,
  }));
}

/**
 * Require that the user has access to a specific team.
 * SUPER_ADMIN and ADMIN can access any team.
 */
export async function requireTeamAccess(
  user: AuthenticatedUser,
  teamId: string
): Promise<void> {
  // SUPER_ADMIN and ADMIN have global access
  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
    return;
  }

  const teams = await getUserTeams(user.id);
  const hasAccess = teams.some((t) => t.teamId === teamId);
  if (!hasAccess) {
    throw new AuthError("Access denied to this team's resources", 403);
  }
}

/**
 * Get the team IDs a user can access.
 * Used for scoping queries (WHERE teamId IN [...]).
 */
export async function getAccessibleTeamIds(
  user: AuthenticatedUser
): Promise<string[]> {
  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
    // Admins can access all teams — return empty array to indicate "no filter"
    return [];
  }

  const teams = await getUserTeams(user.id);
  return teams.map((t) => t.teamId);
}

/**
 * Require that the user owns a resource (or is admin).
 * The resource must have a userId or counselorId field.
 */
export async function requireResourceOwnership(
  user: AuthenticatedUser,
  resourceUserId?: string | null
): Promise<void> {
  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
    return;
  }
  if (resourceUserId && resourceUserId === user.id) {
    return;
  }
  throw new AuthError("You do not have access to this resource", 403);
}
