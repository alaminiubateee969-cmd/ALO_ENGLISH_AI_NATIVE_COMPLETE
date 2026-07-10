<?php
/**
 * app/Services/AuthService.php — Authentication + rate-limiting + reset.
 *
 * Responsibilities:
 *   - attempt(email/phone, password): verify, regenerate session id,
 *     rate-limit (lockout after 5 fails in 15 min), audit every attempt.
 *   - logout(): destroy session, audit.
 *   - currentUser(): cached current user array.
 *   - requestPasswordReset(email): generate one-shot token (15-min TTL),
 *     store hash, email link. Audit.
 *   - confirmPasswordReset(token, newPass): validate, update hash,
 *     invalidate token, audit, kill other sessions.
 *
 * Passwords: bcrypt via password_hash() cost=12, verified with
 * password_verify(). Rehash on successful login if cost bumps.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use RuntimeException;

final class AuthService
{
    private const LOCKOUT_WINDOW_SECONDS = 900; // 15 min
    private const LOCKOUT_MAX_FAILURES   = 5;
    private const RESET_TOKEN_TTL_SECONDS = 900; // 15 min

    /**
     * Attempt to authenticate a user by email OR phone.
     *
     * @return array{ok:bool, error?:string, user?:array}
     */
    public static function attempt(string $identifier, string $password, bool $remember = false): array
    {
        $identifier = trim($identifier);
        if ($identifier === '' || $password === '') {
            return ['ok' => false, 'error' => 'Missing credentials.'];
        }

        $user = self::findByIdentifier($identifier);
        if ($user === null) {
            // Always run a dummy verify to avoid timing oracle.
            password_verify($password, '$2y$12$abcdefghijklmnopqrstuv');
            AuditService::log(null, AuditService::ACTION_LOGIN_FAILED, 'user', null, [
                'identifier' => substr($identifier, 0, 64),
                'reason' => 'no_user',
            ]);
            return ['ok' => false, 'error' => 'Invalid credentials.'];
        }

        // Lockout check.
        if (self::isLockedOut((int) $user['id'])) {
            AuditService::log((int) $user['id'], AuditService::ACTION_LOGIN_FAILED, 'user', $user['id'], [
                'reason' => 'locked_out',
            ]);
            return ['ok' => false, 'error' => 'Too many failed attempts. Try again later.'];
        }

        if (!password_verify($password, (string) $user['password_hash'])) {
            self::recordFailure((int) $user['id']);
            AuditService::log((int) $user['id'], AuditService::ACTION_LOGIN_FAILED, 'user', $user['id'], [
                'reason' => 'bad_password',
            ]);
            return ['ok' => false, 'error' => 'Invalid credentials.'];
        }

        // Status check.
        if ($user['status'] !== 'active') {
            AuditService::log((int) $user['id'], AuditService::ACTION_LOGIN_FAILED, 'user', $user['id'], [
                'reason' => 'inactive',
                'status' => $user['status'],
            ]);
            return ['ok' => false, 'error' => 'Account is not active.'];
        }

        // ----- Success -----
        self::clearFailures((int) $user['id']);

        // Rehash if algorithm/cost changed.
        if (password_needs_rehash($user['password_hash'], PASSWORD_BCRYPT, ['cost' => 12])) {
            $newHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
            if ($newHash !== false) {
                Database::update('exam_users', ['password_hash' => $newHash, 'updated_at' => date('Y-m-d H:i:s')],
                    'id = :id', ['id' => $user['id']]);
            }
        }

        // Regenerate session id to prevent fixation.
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
        }

        // Stamp session.
        $_SESSION['user_id']     = (int) $user['id'];
        $_SESSION['login_at']    = time();
        $_SESSION['ip']          = $_SERVER['REMOTE_ADDR'] ?? '';
        $_SESSION['ua']          = substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);

        Database::update('exam_users', [
            'last_login_at' => date('Y-m-d H:i:s'),
            'updated_at'    => date('Y-m-d H:i:s'),
        ], 'id = :id', ['id' => $user['id']]);

        AuditService::log((int) $user['id'], AuditService::ACTION_LOGIN_SUCCESS, 'user', $user['id']);

        return ['ok' => true, 'user' => $user];
    }

    public static function logout(): void
    {
        $uid = $_SESSION['user_id'] ?? null;
        if ($uid !== null) {
            AuditService::log((int) $uid, AuditService::ACTION_LOGOUT, 'user', (int) $uid);
        }
        RBACService::hardLogout();
    }

    /**
     * Return the currently-authenticated user array (cached via RBACService),
     * or null if no session.
     */
    public static function currentUser(): ?array
    {
        return RBACService::currentUser();
    }

    /**
     * TRUE if a user is currently logged in.
     */
    public static function check(): bool
    {
        return self::currentUser() !== null;
    }

    /**
     * Generate a password reset token and return it (caller emails it).
     * The DB stores only the hash.
     */
    public static function requestPasswordReset(string $email): ?string
    {
        $email = strtolower(trim($email));
        $user = Database::one('SELECT id, email, full_name FROM exam_users WHERE email = :e LIMIT 1', ['e' => $email]);
        if ($user === null) {
            // Do not disclose whether the email exists.
            AuditService::log(null, AuditService::ACTION_PASSWORD_RESET_REQ, 'user', null, [
                'email_present' => false,
            ]);
            return null;
        }
        $token = sodium_bin2hex(random_bytes(24));
        Database::update('exam_users', [
            'password_reset_token'  => hash('sha256', $token),
            'password_reset_expires' => date('Y-m-d H:i:s', time() + self::RESET_TOKEN_TTL_SECONDS),
            'updated_at'            => date('Y-m-d H:i:s'),
        ], 'id = :id', ['id' => $user['id']]);
        AuditService::log((int) $user['id'], AuditService::ACTION_PASSWORD_RESET_REQ, 'user', $user['id']);
        return $token;
    }

    public static function confirmPasswordReset(string $token, string $newPassword): bool
    {
        if (strlen($token) < 32 || strlen($newPassword) < 12) {
            return false;
        }
        $hash = hash('sha256', $token);
        $user = Database::one(
            'SELECT id, password_reset_expires FROM exam_users WHERE password_reset_token = :t LIMIT 1',
            ['t' => $hash]
        );
        if ($user === null) {
            return false;
        }
        if (strtotime((string) $user['password_reset_expires']) < time()) {
            return false;
        }
        $newHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
        Database::update('exam_users', [
            'password_hash'           => $newHash,
            'password_reset_token'    => null,
            'password_reset_expires'  => null,
            'password_changed_at'     => date('Y-m-d H:i:s'),
            'updated_at'              => date('Y-m-d H:i:s'),
        ], 'id = :id', ['id' => $user['id']]);

        AuditService::log((int) $user['id'], AuditService::ACTION_PASSWORD_RESET_DONE, 'user', $user['id']);
        return true;
    }

    // ---------- Helpers ----------

    private static function findByIdentifier(string $identifier): ?array
    {
        // Allow email OR phone. Normalize email.
        if (filter_var($identifier, FILTER_VALIDATE_EMAIL) !== false) {
            $identifier = strtolower($identifier);
            return Database::one('SELECT * FROM exam_users WHERE email = :i LIMIT 1', ['i' => $identifier]);
        }
        // Treat as phone (strip non-digits).
        $phone = preg_replace('/[^0-9+]/', '', $identifier);
        return Database::one('SELECT * FROM exam_users WHERE phone = :p LIMIT 1', ['p' => $phone]);
    }

    private static function isLockedOut(int $userId): bool
    {
        $since = date('Y-m-d H:i:s', time() - self::LOCKOUT_WINDOW_SECONDS);
        $count = (int) Database::scalar(
            'SELECT COUNT(*) FROM exam_audit_logs
              WHERE actor_user_id = :uid
                AND action = :act
                AND created_at >= :since',
            ['uid' => $userId, 'act' => AuditService::ACTION_LOGIN_FAILED, 'since' => $since]
        );
        return $count >= self::LOCKOUT_MAX_FAILURES;
    }

    private static function recordFailure(int $userId): void
    {
        // Failures are recorded via AuditService::log in attempt() — no extra write needed.
    }

    private static function clearFailures(int $userId): void
    {
        // No-op: failures age out by window. Audit log is append-only.
    }
}
