<?php
/**
 * app/Services/RBACService.php — Role-Based Access Control.
 *
 * Loads the current user's roles from exam_user_roles (joined with
 * exam_roles) and consults config/permissions.php to verify access.
 * Honors role hierarchy (SUPER_ADMIN inherits ADMIN inherits ...).
 *
 * The current user is loaded once per request and cached.
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;

final class RBACService
{
    private static ?array $currentUser = null;
    private static ?array $userRoles = null;
    private static ?array $permissionsMap = null;
    private static ?array $hierarchy = null;

    /** Load (or return cached) current user array from session. */
    public static function currentUser(): ?array
    {
        if (self::$currentUser !== null) {
            return self::$currentUser;
        }
        if (session_status() !== PHP_SESSION_ACTIVE || empty($_SESSION['user_id'])) {
            return null;
        }
        $user = Database::one(
            'SELECT u.id, u.user_code, u.email, u.phone, u.full_name, u.status,
                    u.password_hash IS NOT NULL AS has_password,
                    u.mfa_enabled, u.last_login_at, u.created_at
               FROM exam_users u
              WHERE u.id = :id AND u.status = :active
              LIMIT 1',
            ['id' => (int) $_SESSION['user_id'], 'active' => 'active']
        );
        if ($user === null) {
            // Session points at a non-existent or inactive user — kill session.
            self::hardLogout();
            return null;
        }
        self::$currentUser = $user;
        self::$userRoles = self::loadRoles((int) $user['id']);
        return $user;
    }

    /** Returns array of role codes for the current user (e.g. ['ADMIN']). */
    public static function roles(): array
    {
        if (self::$userRoles === null) {
            $u = self::currentUser();
            self::$userRoles = $u === null ? [] : self::loadRoles((int) $u['id']);
        }
        return self::$userRoles;
    }

    /** TRUE if current user holds at least one of the given roles. */
    public static function hasRole(string ...$roles): bool
    {
        if ($roles === []) {
            return false;
        }
        $mine = self::roles();
        if (in_array('SUPER_ADMIN', $mine, true)) {
            return true; // implicit superuser
        }
        foreach ($roles as $r) {
            if (in_array($r, $mine, true)) {
                return true;
            }
            // Honor hierarchy: if user holds ADMIN and 'EXAM_MANAGER' requested, allow.
            if (self::inheritsAny($r, $mine)) {
                return true;
            }
        }
        return false;
    }

    /** TRUE if current user has the given permission. */
    public static function hasPermission(string $permission): bool
    {
        $mine = self::roles();
        if (in_array('SUPER_ADMIN', $mine, true)) {
            return true;
        }
        $map = self::permissionsMap();
        if (!isset($map[$permission])) {
            return false;
        }
        foreach ($map[$permission] as $role) {
            if (in_array($role, $mine, true)) {
                return true;
            }
            if (self::inheritsAny($role, $mine)) {
                return true;
            }
        }
        return false;
    }

    /** Terminate the session immediately. */
    public static function hardLogout(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            $_SESSION = [];
            session_regenerate_id(true);
            session_destroy();
        }
        self::$currentUser = null;
        self::$userRoles = null;
    }

    // ---------- Internals ----------

    private static function loadRoles(int $userId): array
    {
        $rows = Database::all(
            'SELECT r.role_code
               FROM exam_user_roles ur
               JOIN exam_roles r ON r.id = ur.role_id
              WHERE ur.user_id = :uid',
            ['uid' => $userId]
        );
        return array_map(static fn(array $r) => $r['role_code'], $rows);
    }

    private static function permissionsMap(): array
    {
        if (self::$permissionsMap === null) {
            self::$permissionsMap = require __DIR__ . '/../../config/permissions.php';
            self::$permissionsMap = self::$permissionsMap['permissions'] ?? [];
        }
        return self::$permissionsMap;
    }

    private static function hierarchy(): array
    {
        if (self::$hierarchy === null) {
            $cfg = require __DIR__ . '/../../config/permissions.php';
            self::$hierarchy = $cfg['hierarchy'] ?? [];
        }
        return self::$hierarchy;
    }

    /**
     * Returns true if any of $mine inherits from $required (transitively).
     * E.g. ADMIN inherits EXAM_MANAGER, EXAM_MANAGER inherits TEACHER.
     */
    private static function inheritsAny(string $required, array $mine): bool
    {
        $hierarchy = self::hierarchy();
        $visited = [];
        $queue = $mine;
        while ($queue) {
            $current = array_shift($queue);
            if (isset($visited[$current])) {
                continue;
            }
            $visited[$current] = true;
            if ($current === $required) {
                return true;
            }
            foreach (($hierarchy[$current] ?? []) as $child) {
                $queue[] = $child;
            }
        }
        return false;
    }
}
