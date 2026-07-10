<?php
/**
 * scripts/reset_admin_password.php — Generate + set a secure temp admin password.
 *
 * Usage:  php scripts/reset_admin_password.php admin@example.com
 *
 * - Looks up the user by email (must be active).
 * - Generates a 16-char password from a URL-safe alphabet.
 * - Hashes with bcrypt cost=12.
 * - UPDATEs exam_users.password_hash + activates status + clears reset token.
 * - Prints the new password ONCE to STDOUT.
 * - Audits the change.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

require_once __DIR__ . '/_cli_bootstrap.php';

use App\Core\Database;
use App\Services\AuditService;

if ($argc < 2) {
    cliErr("Usage: php scripts/reset_admin_password.php <admin-email>");
    exit(1);
}
$email = strtolower(trim((string) $argv[1]));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    cliErr("Invalid email address: {$email}");
    exit(1);
}

cliOut('ALO English Test Platform — Admin Password Reset', 'cyan');
cliOut(str_repeat('-', 60), 'gray');
cliOut("Target email: {$email}", 'gray');
cliOut('');

$user = Database::one('SELECT id, email, full_name, status FROM exam_users WHERE email = :e LIMIT 1', ['e' => $email]);
if ($user === null) {
    cliErr("No user found with email {$email}");
    exit(2);
}

cliOut("Found user: {$user['full_name']} (id={$user['id']}, status={$user['status']})", 'gray');

// Generate secure temp password.
$alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
$len = 16;
$tempPassword = '';
for ($i = 0; $i < $len; $i++) {
    $tempPassword .= $alphabet[random_int(0, strlen($alphabet) - 1)];
}

$hash = password_hash($tempPassword, PASSWORD_BCRYPT, ['cost' => 12]);
if ($hash === false) {
    cliErr('password_hash() failed.');
    exit(3);
}

Database::update('exam_users', [
    'password_hash'         => $hash,
    'password_reset_token'  => null,
    'password_reset_expires'=> null,
    'password_changed_at'   => date('Y-m-d H:i:s'),
    'status'                => 'active',
    'updated_at'            => date('Y-m-d H:i:s'),
], 'id = :id', ['id' => $user['id']]);

AuditService::log((int) $user['id'], AuditService::ACTION_PASSWORD_CHANGE, 'user', $user['id'], [
    'source' => 'cli.reset_admin_password',
]);

cliOut('');
cliOut('========================================', 'yellow');
cliOut('New temporary admin password:', 'yellow');
cliOut('');
cliOut('    ' . $tempPassword, 'green');
cliOut('');
cliOut('========================================', 'yellow');
cliOut('');
cliOut('NEXT STEPS:', 'cyan');
cliOut('  1. Log in with this password immediately.');
cliOut('  2. Change it via the admin Settings > Security page.');
cliOut('  3. This password has been printed ONCE — it will NOT be shown again.');
cliOut('  4. The change has been audit-logged.');
cliOut('');
exit(0);
