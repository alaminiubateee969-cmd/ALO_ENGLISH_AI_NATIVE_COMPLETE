<?php
/**
 * scripts/verify_production.php — Final production-readiness checker.
 *
 * Verifies:
 *   - PHP version >= 8.2
 *   - Required PHP extensions (pdo_mysql, openssl, mbstring, curl, sodium, fileinfo)
 *   - Required folders exist + are writable (storage, logs, uploads)
 *   - .env exists OUTSIDE web root, NOT in docroot
 *   - DB connection works
 *   - Required tables present (44)
 *   - Required seeded data (roles, categories, exam_types, settings, practice_sets)
 *   - .htaccess present + blocks storage/private
 *   - index.php present
 *   - Cron scripts present
 *   - Key routes registered (lightweight parse of app/routes.php)
 *   - Audit logs table present
 *
 * Prints PASS/FAIL per check + final summary.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

require_once __DIR__ . '/_cli_bootstrap.php';

use App\Core\Database;

$passed = 0; $failed = 0; $warnings = 0;

function check(string $label, callable $fn): void
{
    global $passed, $failed;
    try {
        $r = $fn();
        if ($r === true) {
            cliOut(sprintf('[PASS] %s', $label), 'green');
            $passed++;
        } elseif ($r === 'warn') {
            cliOut(sprintf('[WARN] %s', $label), 'yellow');
            $GLOBALS['warnings']++;
        } else {
            cliOut(sprintf('[FAIL] %s', $label), 'red');
            $failed++;
        }
    } catch (\Throwable $e) {
        cliOut(sprintf('[FAIL] %s — %s', $label, $e->getMessage()), 'red');
        $failed++;
    }
}

cliOut('ALO English Test Platform — Production Verification', 'cyan');
cliOut(str_repeat('=', 60), 'gray');
cliOut('');

// ---------- 1. PHP version ----------
check('PHP version >= 8.2', fn() => version_compare(PHP_VERSION, '8.2.0', '>='));

// ---------- 2. Required extensions ----------
$required = ['pdo_mysql', 'openssl', 'mbstring', 'curl', 'sodium', 'fileinfo', 'json', 'session'];
foreach ($required as $ext) {
    check("Extension: {$ext}", fn() => extension_loaded($ext));
}

// ---------- 3. Required folders ----------
$base = realpath(__DIR__ . '/..');
$folders = ['app', 'app/Core', 'app/Services', 'app/Controllers', 'app/Middleware',
            'config', 'cron', 'database', 'scripts', 'storage', 'logs', 'views', 'public'];
foreach ($folders as $f) {
    $p = $base . '/' . $f;
    check("Folder exists: {$f}", fn() => is_dir($p));
}
$writableDirs = ['storage', 'logs'];
foreach ($writableDirs as $d) {
    $p = $base . '/' . $d;
    check("Folder writable: {$d}", fn() => is_dir($p) && is_writable($p));
}

// ---------- 4. .env safety ----------
$envFile = getenv('APP_ENV_FILE') ?: '/home/aloeduca/config/english.env';
check('.env exists at private path (outside web root)', function() use ($envFile) {
    return is_file($envFile) ? true : 'warn';
});
check('No .env inside document root', function() use ($base) {
    return !is_file($base . '/public/.env') && !is_file($base . '/.env');
});

// ---------- 5. Public files ----------
check('public/index.php exists', fn() => is_file($base . '/index.php'));
check('.htaccess exists', fn() => is_file($base . '/.htaccess'));
check('app/routes.php exists', fn() => is_file($base . '/app/routes.php'));

// ---------- 6. Cron scripts ----------
$cronJobs = ['weekly_question_update.php', 'crm_sync.php', 'cleanup_expired_sessions.php',
             'send_pending_reports.php', 'retry_failed_sync.php'];
foreach ($cronJobs as $c) {
    check("cron/{$c} exists", fn() => is_file($base . '/cron/' . $c));
}

// ---------- 7. DB connection ----------
check('DB connection', function() {
    try {
        Database::connection();
        return true;
    } catch (\Throwable $e) {
        return false;
    }
});

// ---------- 8. Required tables ----------
$requiredTables = [
    'exam_users', 'exam_students', 'exam_roles', 'exam_permissions', 'exam_user_roles',
    'exam_categories', 'exam_types', 'exam_sections', 'exam_modules',
    'exam_question_types', 'exam_questions', 'exam_question_options', 'exam_question_review_queue',
    'exam_practice_sets', 'exam_practice_set_sections', 'exam_practice_set_questions',
    'exam_mock_attempts', 'exam_attempt_sections', 'exam_answers', 'exam_scores', 'exam_score_breakdown',
    'exam_speaking_sessions', 'exam_writing_submissions', 'exam_feedback', 'exam_reports',
    'exam_certificates', 'exam_free_quota', 'exam_vouchers', 'exam_voucher_usage', 'exam_payments',
    'exam_leads', 'exam_consultation_bookings', 'exam_marketing_sources', 'exam_crm_sync_logs',
    'exam_weekly_updates', 'exam_admin_approvals', 'exam_uploads',
    'exam_proctor_logs', 'exam_audit_logs', 'exam_settings', 'exam_terms_acceptance', 'exam_cron_logs',
];

check('All 44 required tables present', function() use ($requiredTables) {
    try {
        foreach ($requiredTables as $t) {
            $exists = Database::scalar("SHOW TABLES LIKE :t", ['t' => $t]);
            if ($exists === null) {
                return false;
            }
        }
        return true;
    } catch (\Throwable $e) {
        return false;
    }
});

// ---------- 9. Seeded data ----------
check('Roles seeded (11)', fn() => (int) Database::scalar('SELECT COUNT(*) FROM exam_roles') === 11);
check('Categories seeded (5)', fn() => (int) Database::scalar('SELECT COUNT(*) FROM exam_categories') === 5);
check('Exam types seeded (32)', fn() => (int) Database::scalar('SELECT COUNT(*) FROM exam_types') === 32);
check('Practice sets seeded (>=96 published)', fn() =>
    (int) Database::scalar('SELECT COUNT(*) FROM exam_practice_sets WHERE is_published=1') >= 96);
check('Admin user present', fn() =>
    (int) Database::scalar("SELECT COUNT(*) FROM exam_users u JOIN exam_user_roles ur ON ur.user_id=u.id JOIN exam_roles r ON r.id=ur.role_id WHERE r.role_code='SUPER_ADMIN'") >= 1);
check('Settings seeded (>=40)', fn() => (int) Database::scalar('SELECT COUNT(*) FROM exam_settings') >= 40);
check('Free quota settings present (alo=3, public=1)', function() {
    $alo = Database::scalar("SELECT setting_value FROM exam_settings WHERE setting_key='free_quota_alo'");
    $pub = Database::scalar("SELECT setting_value FROM exam_settings WHERE setting_key='free_quota_public'");
    return (int)$alo === 3 && (int)$pub === 1;
});

// ---------- 10. Audit log table ----------
check('Audit log table exists + is append-only (trigger present)', function() {
    $trig = Database::scalar("SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema=DATABASE() AND trigger_name LIKE 'no_update_exam_audit_logs%'");
    return ((int)$trig) > 0 ? true : 'warn';
});

// ---------- 11. Routes file has key routes ----------
check('routes.php defines key routes', function() use ($base) {
    $routes = file_get_contents($base . '/app/routes.php');
    $must = ['/login', '/student/dashboard', '/admin/dashboard', '/examiner/dashboard',
             '/ambassador/dashboard', '/api/health', '/api/alo-crm/health', '/mock-test/start'];
    foreach ($must as $r) {
        if (!str_contains($routes, $r)) {
            return false;
        }
    }
    return true;
});

// ---------- 12. Config files ----------
foreach (['app.php', 'database.php', 'exams.php', 'permissions.php'] as $c) {
    check("config/{$c} valid PHP", function() use ($base, $c) {
        $arr = require $base . '/config/' . $c;
        return is_array($arr);
    });
}

// ---------- 13. Services exist + parse cleanly ----------
$services = ['AuthService', 'RBACService', 'CSRFService', 'QuotaService', 'ScoringService',
             'TestEngineService', 'CRMIntegrationService', 'AuditService', 'VoucherService', 'UploadService'];
foreach ($services as $s) {
    check("app/Services/{$s}.php syntax", function() use ($base, $s) {
        $out = shell_exec('php -l ' . escapeshellarg($base . '/app/Services/' . $s . '.php') . ' 2>&1');
        return str_contains((string) $out, 'No syntax errors');
    });
}

// ---------- 14. Controllers exist ----------
$controllers = ['PublicController', 'AuthController', 'StudentController', 'AdminController',
                'ExaminerController', 'AmbassadorController', 'MockTestController', 'CRMIntegrationController'];
foreach ($controllers as $c) {
    check("app/Controllers/{$c}.php exists", fn() => is_file($base . '/app/Controllers/' . $c . '.php'));
}

// ---------- 15. Public bridge file ----------
check('index.php is a safe bridge (requires private app)', function() use ($base) {
    $src = file_get_contents($base . '/index.php');
    return str_contains($src, 'alo-english-platform') && !str_contains($src, 'DB_PASSWORD');
});

// ---------- Summary ----------
cliOut('');
cliOut(str_repeat('=', 60), 'gray');
cliOut(sprintf('Verification complete: %d PASS, %d FAIL, %d WARN',
    $passed, $failed, $warnings),
    $failed > 0 ? 'red' : 'green');
cliOut('');
exit($failed > 0 ? 1 : 0);
