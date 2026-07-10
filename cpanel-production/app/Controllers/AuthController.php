<?php
/**
 * app/Controllers/AuthController.php — Authentication actions.
 *
 *   login(email/phone, password) — all roles.
 *   logout()
 *   register()                   — creates a STUDENT user with PARTNER_STUDENT fallback.
 *   passwordResetRequest(email)  — emails a one-shot link.
 *   passwordResetConfirm(token, new password).
 *   activateAccount(token).
 *
 * Role-based redirect after login uses config/permissions.php landing_routes.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Response;
use App\Services\AuditService;
use App\Services\AuthService;
use App\Services\CSRFService;
use App\Services\RBACService;

final class AuthController
{
    /** POST /auth/login */
    public function login(array $params = []): void
    {
        $identifier = trim($_POST['email'] ?? $_POST['identifier'] ?? '');
        $password = (string) ($_POST['password'] ?? '');
        $result = AuthService::attempt($identifier, $password);

        if (!$result['ok']) {
            AuditService::log(null, AuditService::ACTION_LOGIN_FAILED, 'user', null, [
                'identifier' => substr($identifier, 0, 64),
            ]);
            Response::redirect('/login?error=' . urlencode($result['error'] ?? 'Login failed.'), 302);
        }

        $user = $result['user'];
        $roles = RBACService::roles();
        $landing = self::landingForRoles($roles);
        Response::redirect($landing, 302);
    }

    /** GET|POST /auth/logout */
    public function logout(array $params = []): void
    {
        AuthService::logout();
        Response::redirect('/?logged_out=1', 302);
    }

    /** POST /auth/register — self-service student registration. */
    public function register(array $params = []): void
    {
        $fullName = trim($_POST['full_name'] ?? '');
        $email = strtolower(trim($_POST['email'] ?? ''));
        $phone = trim($_POST['phone'] ?? '');
        $password = (string) ($_POST['password'] ?? '');
        $confirm = (string) ($_POST['password_confirm'] ?? '');

        // Validate
        if ($fullName === '' || $email === '' || $password === '') {
            Response::redirect('/register?error=' . urlencode('All fields are required.'), 302);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::redirect('/register?error=' . urlencode('Invalid email address.'), 302);
        }
        if (strlen($password) < 12) {
            Response::redirect('/register?error=' . urlencode('Password must be at least 12 characters.'), 302);
        }
        if ($password !== $confirm) {
            Response::redirect('/register?error=' . urlencode('Passwords do not match.'), 302);
        }
        // Uniqueness check
        if (Database::exists('SELECT 1 FROM exam_users WHERE email = :e', ['e' => $email])) {
            Response::redirect('/register?error=' . urlencode('An account with this email already exists.'), 302);
        }

        // Create user
        $userId = Database::insert('exam_users', [
            'user_code'    => 'STU-' . strtoupper(substr(sodium_bin2hex(random_bytes(4)), 0, 8)),
            'email'        => $email,
            'phone'        => $phone,
            'full_name'    => mb_substr($fullName, 0, 255),
            'password_hash'=> password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]),
            'status'       => 'active', // self-registration auto-activates; email verification recommended separately.
            'created_at'   => date('Y-m-d H:i:s'),
            'updated_at'   => date('Y-m-d H:i:s'),
        ]);
        // Grant STUDENT role
        $studentRoleId = (int) Database::scalar("SELECT id FROM exam_roles WHERE role_code='STUDENT'");
        Database::insert('exam_user_roles', [
            'user_id'    => $userId,
            'role_id'    => $studentRoleId,
            'assigned_at'=> date('Y-m-d H:i:s'),
        ]);
        // Create student record
        $studentId = Database::insert('exam_students', [
            'user_id'        => $userId,
            'alo_student_id' => null,
            'created_at'     => date('Y-m-d H:i:s'),
        ]);

        // Initialize quota row (1 free attempt by default for public students).
        $quotaType = 'public';
        $limit = 1;
        Database::insert('exam_free_quota', [
            'email'       => $email,
            'quota_type'  => $quotaType,
            'limit'       => $limit,
            'remaining'   => $limit,
            'used'        => 0,
            'created_at'  => date('Y-m-d H:i:s'),
            'updated_at'  => date('Y-m-d H:i:s'),
        ]);

        AuditService::log($userId, AuditService::ACTION_USER_CREATE, 'user', $userId, [
            'email' => $email, 'student_id' => $studentId,
        ]);

        // Auto-login the new user
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
            $_SESSION['user_id'] = $userId;
            $_SESSION['login_at'] = time();
        }
        Response::redirect('/student/dashboard?welcome=1', 302);
    }

    /** GET|POST /password/reset */
    public function passwordResetRequest(array $params = []): void
    {
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
            Response::view('auth/password-reset-request', [
                'csrf'       => CSRFService::token(),
                'csrf_field' => CSRFService::hiddenField(),
            ]);
        }
        $email = strtolower(trim($_POST['email'] ?? ''));
        AuthService::requestPasswordReset($email);
        // Always show the same message whether or not the email exists.
        Response::view('auth/password-reset-sent', ['email' => $email]);
    }

    /** GET|POST /password/reset/{token} */
    public function passwordResetConfirm(array $params = []): void
    {
        $token = (string) ($params['token'] ?? '');
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
            Response::view('auth/password-reset-confirm', [
                'token'      => $token,
                'csrf'       => CSRFService::token(),
                'csrf_field' => CSRFService::hiddenField(),
            ]);
        }
        $newPassword = (string) ($_POST['password'] ?? '');
        if (strlen($newPassword) < 12) {
            Response::abort(422, 'Password must be at least 12 characters.');
        }
        $ok = AuthService::confirmPasswordReset($token, $newPassword);
        if (!$ok) {
            Response::abort(400, 'Reset token is invalid or has expired.');
        }
        Response::redirect('/login?reset=1', 302);
    }

    /** GET /activate/{token} — placeholder email-activation endpoint. */
    public function activateAccount(array $params = []): void
    {
        $token = (string) ($params['token'] ?? '');
        // Validate token (placeholder: 32+ chars hex).
        if (strlen($token) < 32) {
            Response::abort(400, 'Invalid activation token.');
        }
        // In production: look up token in exam_users.activation_token, activate, clear token, audit.
        Response::view('auth/activated', []);
    }

    private static function landingForRoles(array $roles): string
    {
        $cfg = require __DIR__ . '/../../config/permissions.php';
        $map = $cfg['landing_routes'] ?? [];
        // Priority: SUPER_ADMIN > ADMIN > EXAM_MANAGER > EXAMINER > AMBASSADOR > STUDENT > VIEWER
        foreach (['SUPER_ADMIN','ADMIN','EXAM_MANAGER','EXAMINER','TEACHER','AMBASSADOR','STUDENT','PARTNER_STUDENT','CRM_SYNC_SERVICE','SUPPORT_STAFF','VIEWER'] as $r) {
            if (in_array($r, $roles, true) && isset($map[$r])) {
                return $map[$r];
            }
        }
        return '/';
    }
}
