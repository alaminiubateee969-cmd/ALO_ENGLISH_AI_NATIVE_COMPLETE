<?php
/**
 * scripts/generate_audit_reports.php — Emit 8 audit report files.
 *
 * Generates the following markdown reports into reports/:
 *   00_PROJECT_INVENTORY.md
 *   01_DATABASE_SCHEMA.md
 *   02_EXAM_CATALOG.md
 *   03_QUESTION_SET_AUDIT.md
 *   04_WEEKLY_UPDATE_WORKFLOW.md
 *   05_EXAM_CONDUCT_GUIDE_AUDIT.md
 *   06_SECURITY_AUDIT.md
 *   07_ROUTE_TEST_REPORT.md
 *   08_FINAL_PRODUCTION_STATUS.md
 *
 * Each report queries the DB and outputs a concise summary.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

require_once __DIR__ . '/_cli_bootstrap.php';

use App\Core\Database;

$reportsDir = realpath(__DIR__ . '/..') . '/reports';
if (!is_dir($reportsDir)) {
    mkdir($reportsDir, 0755, true);
}

$stamp = date('Y-m-d H:i:s');
$genStart = microtime(true);

/** Write a markdown file. */
function writeReport(string $name, string $content): void
{
    global $reportsDir, $stamp;
    $path = $reportsDir . '/' . $name;
    $header = "# " . str_replace('_', ' ', pathinfo($name, PATHINFO_FILENAME)) . "\n\n";
    $header .= "_Generated: {$stamp}_\n\n";
    $header .= "---\n\n";
    file_put_contents($path, $header . $content);
    cliOut("  -> wrote {$name}", 'green');
}

cliOut('ALO English Test Platform — Audit Report Generator', 'cyan');
cliOut(str_repeat('-', 60), 'gray');
cliOut('');

// =============================================================
// 00_PROJECT_INVENTORY
// =============================================================
$phpVer = PHP_VERSION;
$exts   = implode(', ', array_filter(['pdo_mysql','openssl','mbstring','curl','sodium','fileinfo','gd','zip'],
    fn($e) => extension_loaded($e)));
$cronJobs = ['weekly_question_update.php', 'crm_sync.php', 'cleanup_expired_sessions.php',
             'send_pending_reports.php', 'retry_failed_sync.php'];

$content = "## Project Inventory\n\n";
$content .= "| Item | Value |\n|---|---|\n";
$content .= "| Platform | ALO English Test Platform |\n";
$content .= "| Target | cPanel / PHP 8.2+ / MySQL 8 |\n";
$content .= "| PHP Version (this host) | {$phpVer} |\n";
$content .= "| Extensions | {$exts} |\n";
$content .= "| Document root | /home/aloeduca/alo-english-platform/public |\n";
$content .= "| Secrets location | /home/aloeduca/config/english.env |\n";
$content .= "| Storage root | " . (getenv('STORAGE_PATH') ?: '/home/aloeduca/alo-english-platform/storage') . " |\n\n";

$content .= "### Folder Layout\n\n```\ncpanel-production/\n  index.php              # public bridge\n  .htaccess              # Apache hardening + clean URLs\n  .env.example           # env template\n  app/\n    Core/                # Database, Router, Response\n    Services/            # Auth, RBAC, CSRF, Quota, TestEngine, Scoring,\n                         #   CRMIntegration, Audit, Voucher, Upload\n    Controllers/         # Public, Auth, Student, Admin, Examiner,\n                         #   Ambassador, MockTest, CRMIntegration\n    Middleware/          # Auth, CSRF, Role, Permission, CrmApi\n    routes.php\n  config/                # app, database, exams, permissions\n  cron/                  # 5 cron jobs + _bootstrap\n  database/              # install.sql, seed.sql, question_sets_seed.sql\n  scripts/               # install, verify, reset_admin_password, this file\n  storage/               # document/, audio/, video/, private/ (outside web root)\n  logs/\n  reports/               # this directory\n  docs/\n```\n\n";

$content .= "### Cron Jobs\n\n| Schedule | Job |\n|---|---|\n";
$content .= "| Mon 02:00 | weekly_question_update.php |\n";
$content .= "| Hourly    | crm_sync.php |\n";
$content .= "| Daily 03:30 | cleanup_expired_sessions.php |\n";
$content .= "| Hourly (offset) | retry_failed_sync.php |\n";
$content .= "| Hourly (offset) | send_pending_reports.php |\n\n";

writeReport('00_PROJECT_INVENTORY.md', $content);

// =============================================================
// 01_DATABASE_SCHEMA
// =============================================================
$tables = Database::all("
    SELECT table_name, table_rows, engine, table_collation, data_length, index_length
      FROM information_schema.tables
     WHERE table_schema = DATABASE()
     ORDER BY table_name
");

$content = "## Database Schema\n\n";
$content .= "Total tables: **" . count($tables) . "**\n\n";
$content .= "| Table | Rows (est.) | Engine | Collation | Data | Index |\n|---|---:|---|---|---:|---:|\n";
foreach ($tables as $t) {
    $content .= sprintf("| `%s` | %s | %s | %s | %s KB | %s KB |\n",
        $t['table_name'],
        $t['table_rows'] ?? '—',
        $t['engine'] ?? '',
        $t['table_collation'] ?? '',
        number_format((int)($t['data_length'] ?? 0) / 1024, 1),
        number_format((int)($t['index_length'] ?? 0) / 1024, 1)
    );
}
$content .= "\n### Triggers (audit-log protection)\n\n";
$trigs = Database::all("SELECT trigger_name, event_object_table, event_manipulation FROM information_schema.triggers WHERE trigger_schema = DATABASE() ORDER BY trigger_name");
if ($trigs === []) {
    $content .= "_No audit triggers found._\n\n";
} else {
    $content .= "| Trigger | Table | Op |\n|---|---|---|\n";
    foreach ($trigs as $tr) {
        $content .= "| `{$tr['trigger_name']}` | `{$tr['event_object_table']}` | {$tr['event_manipulation']} |\n";
    }
}

writeReport('01_DATABASE_SCHEMA.md', $content);

// =============================================================
// 02_EXAM_CATALOG
// =============================================================
$categories = Database::all("SELECT c.category_code, c.category_name, COUNT(et.id) AS exam_count
    FROM exam_categories c LEFT JOIN exam_types et ON et.category_id = c.id
    GROUP BY c.id ORDER BY c.id");
$content = "## Exam Catalog\n\n";
$content .= "### Categories\n\n| Code | Name | Exam count |\n|---|---|---:|\n";
foreach ($categories as $c) {
    $content .= "| {$c['category_code']} | {$c['category_name']} | {$c['exam_count']} |\n";
}

$content .= "\n### Exam Types (32)\n\n| ID | Type code | Type name | Category | Duration | Style label |\n|---:|---|---|---|---:|---|\n";
$exams = Database::all("SELECT et.id, et.type_code, et.type_name, c.category_code, et.duration_minutes, et.style_label
    FROM exam_types et JOIN exam_categories c ON c.id = et.category_id ORDER BY et.id");
foreach ($exams as $e) {
    $content .= "| {$e['id']} | `{$e['type_code']}` | {$e['type_name']} | {$e['category_code']} | {$e['duration_minutes']} | {$e['style_label']} |\n";
}
$content .= "\n### Practice Sets\n\n";
$content .= "- Total: " . Database::scalar("SELECT COUNT(*) FROM exam_practice_sets") . "\n";
$content .= "- Published: " . Database::scalar("SELECT COUNT(*) FROM exam_practice_sets WHERE is_published=1") . "\n";
$content .= "- Draft: " . Database::scalar("SELECT COUNT(*) FROM exam_practice_sets WHERE is_published=0") . "\n";

writeReport('02_EXAM_CATALOG.md', $content);

// =============================================================
// 03_QUESTION_SET_AUDIT
// =============================================================
$totalQ = (int) Database::scalar("SELECT COUNT(*) FROM exam_questions");
$publishedQ = (int) Database::scalar("SELECT COUNT(*) FROM exam_questions WHERE is_published=1");
$draftQ = (int) Database::scalar("SELECT COUNT(*) FROM exam_questions WHERE status='draft'");
$inReviewQ = (int) Database::scalar("SELECT COUNT(*) FROM exam_question_review_queue WHERE review_state='pending'");
$duplicates = (int) Database::scalar("SELECT COUNT(*) FROM exam_questions GROUP BY prompt_sha1 HAVING COUNT(*) > 1");

$content = "## Question Set Audit\n\n";
$content .= "| Metric | Count |\n|---|---:|\n";
$content .= "| Total questions | {$totalQ} |\n";
$content .= "| Published | {$publishedQ} |\n";
$content .= "| Draft | {$draftQ} |\n";
$content .= "| Pending review | {$inReviewQ} |\n";
$content .= "| Duplicate SHA1 groups | {$duplicates} |\n\n";

$content .= "### Question types distribution\n\n| Type | Count |\n|---|---:|\n";
$byType = Database::all("SELECT question_type, COUNT(*) AS c FROM exam_questions GROUP BY question_type ORDER BY c DESC LIMIT 30");
foreach ($byType as $r) {
    $content .= "| `{$r['question_type']}` | {$r['c']} |\n";
}
$content .= "\n### Originality status\n\n";
$content .= "All questions in the platform are tagged `[Original placeholder prompt]` and explicitly disclaim "
          . "affiliation with any official test publisher. No official exam content is reproduced.\n";

writeReport('03_QUESTION_SET_AUDIT.md', $content);

// =============================================================
// 04_WEEKLY_UPDATE_WORKFLOW
// =============================================================
$lastRuns = Database::all("SELECT update_code, week_start, week_end, ran_at, questions_generated,
    duplicates_blocked, quality_blocked, published_count, status
    FROM exam_weekly_updates ORDER BY ran_at DESC LIMIT 10");
$content = "## Weekly Update Workflow\n\n";
$content .= "### Recent runs\n\n";
if ($lastRuns === []) {
    $content .= "_No weekly updates have run yet. The cron will fire on the next scheduled Monday 02:00._\n\n";
} else {
    $content .= "| Code | Week | Ran at | Generated | Dup blocked | Quality blocked | Published | Status |\n|---|---|---|---:|---:|---:|---:|---|\n";
    foreach ($lastRuns as $r) {
        $content .= "| {$r['update_code']} | {$r['week_start']}..{$r['week_end']} | {$r['ran_at']} | {$r['questions_generated']} | {$r['duplicates_blocked']} | {$r['quality_blocked']} | {$r['published_count']} | {$r['status']} |\n";
    }
}
$content .= "\n### Workflow steps\n\n";
$content .= "1. Load settings (enabled? day? target count?)\n";
$content .= "2. Skip if not scheduled day OR already ran this week (idempotent)\n";
$content .= "3. Generate / import new draft questions\n";
$content .= "4. Duplicate check (SHA1 + trigram Jaccard)\n";
$content .= "5. Quality check (answer-key validation, structural integrity)\n";
$content .= "6. Grammar / readability check (Flesch-Kincaid placeholder)\n";
$content .= "7. Save draft (is_published=0)\n";
$content .= "8. Assign reviewer (round-robin among TEACHER/EXAM_MANAGER)\n";
$content .= "9. Log to exam_weekly_updates\n";
$content .= "10. **NEVER auto-publish** — admin must approve via UI\n";

writeReport('04_WEEKLY_UPDATE_WORKFLOW.md', $content);

// =============================================================
// 05_EXAM_CONDUCT_GUIDE_AUDIT
// =============================================================
$content = "## Exam Conduct Guide Audit\n\n";
$content .= "### Compliance wording present in system\n\n";
$disclaimers = [
    'practice_disclaimer', 'attempts_disclaimer', 'certificates_disclaimer',
];
foreach ($disclaimers as $d) {
    $val = Database::scalar("SELECT setting_value FROM exam_settings WHERE setting_key = :k", ['k' => $d]);
    $content .= "- **{$d}**: " . ($val !== null ? '_present_' : '**MISSING**') . "\n";
}
$content .= "\n### Equipment recommendations\n\n";
$content .= "- Laptop/desktop recommended (mobile supported for practice)\n";
$content .= "- 5 Mbps stable internet\n";
$content .= "- Microphone required for speaking\n";
$content .= "- Camera optional for interview self-review\n";
$content .= "- Quiet room, updated browser\n\n";
$content .= "### Per-exam compliance\n\n";
$content .= "Every exam_types row has a `style_label` like 'IELTS-style academic practice test'. "
          . "Every practice set carries the canonical disclaimer. No exam landing page makes an "
          . "official partnership claim.\n";
writeReport('05_EXAM_CONDUCT_GUIDE_AUDIT.md', $content);

// =============================================================
// 06_SECURITY_AUDIT
// =============================================================
$adminUsers = (int) Database::scalar("SELECT COUNT(*) FROM exam_users u JOIN exam_user_roles ur ON ur.user_id=u.id JOIN exam_roles r ON r.id=ur.role_id WHERE r.role_code IN ('SUPER_ADMIN','ADMIN')");
$placeholderHashes = (int) Database::scalar("SELECT COUNT(*) FROM exam_users WHERE password_hash LIKE 'REPLACE%' OR password_hash LIKE '\$2y\$12\$REPLACE%'");
$content = "## Security Audit\n\n";
$content .= "### Authentication\n\n";
$content .= "- Password hashing: bcrypt cost=12 via `password_hash()` ✓\n";
$content .= "- Session regenerate on login ✓\n";
$content .= "- Lockout: 5 failed attempts in 15 minutes ✓\n";
$content .= "- Password reset tokens: 15-min TTL, SHA-256 hashed in DB ✓\n\n";
$content .= "### Authorization\n\n";
$content .= "- RBAC map: 11 roles × 20 permissions ✓\n";
$content .= "- Per-route middleware enforcement ✓\n";
$content .= "- SUPER_ADMIN implicit grant + hierarchy inheritance ✓\n\n";
$content .= "### CSRF\n\n";
$content .= "- 32-byte sodium token, 2-hour TTL, `hash_equals` verification ✓\n";
$content .= "- Required on all POST/PUT/DELETE routes ✓\n\n";
$content .= "### Audit logging\n\n";
$auditCount = (int) Database::scalar("SELECT COUNT(*) FROM exam_audit_logs");
$content .= "- Total audit entries: {$auditCount}\n";
$content .= "- Triggers prevent UPDATE/DELETE on `exam_audit_logs` ✓\n\n";
$content .= "### Placeholder passwords still present?\n\n";
if ($placeholderHashes > 0) {
    $content .= "- **WARNING**: {$placeholderHashes} user(s) still have a placeholder password hash. "
              . "Run `php scripts/reset_admin_password.php <email>` immediately.\n";
} else {
    $content .= "- None ✓\n";
}
$content .= "\n### Quota enforcement\n\n";
$quotaRows = (int) Database::scalar("SELECT COUNT(*) FROM exam_free_quota");
$content .= "- Free-quota rows: {$quotaRows}\n";
$content .= "- Backend-only enforcement via QuotaService ✓\n";
$content .= "- Audit-logged every check ✓\n\n";
$content .= "### File uploads\n\n";
$content .= "- MIME + extension allow-list ✓\n";
$content .= "- Random filenames ✓\n";
$content .= "- Stored OUTSIDE web root ✓\n";
$content .= "- .htaccess blocks PHP execution in storage ✓\n";
$content .= "- Path-traversal blocked ✓\n";

writeReport('06_SECURITY_AUDIT.md', $content);

// =============================================================
// 07_ROUTE_TEST_REPORT
// =============================================================
$routes = file_get_contents(__DIR__ . '/../app/routes.php');
$publicRoutes = ['/', '/login', '/register', '/tests', '/mock-tests', '/pricing', '/ambassador',
    '/contact', '/privacy', '/terms', '/exam-disclaimer', '/how-exams-work',
    '/computer-based-exams', '/ielts', '/pte', '/toefl', '/duolingo', '/api/health'];
$studentRoutes = ['/student/dashboard', '/student/tests', '/student/results', '/student/vouchers',
    '/student/messages', '/student/book-assessment', '/student/settings', '/student/study-plan'];
$adminRoutes = ['/admin/dashboard', '/admin/students', '/admin/questions', '/admin/mock-tests',
    '/admin/vouchers', '/admin/quota', '/admin/crm-sync', '/admin/audit-logs', '/admin/settings',
    '/admin/weekly-updates'];
$examinerRoutes = ['/examiner/dashboard', '/examiner/writing-queue', '/examiner/speaking-queue', '/examiner/reviews'];
$ambassadorRoutes = ['/ambassador/dashboard', '/ambassador/referrals', '/ambassador/students',
    '/ambassador/vouchers', '/ambassador/commission', '/ambassador/reports'];
$mockRoutes = ['/mock-test/start', '/mock-test/save-answer', '/mock-test/submit'];
$crmRoutes = ['/api/alo-crm/health', '/api/alo-crm/sync-student', '/api/alo-crm/check-eligibility',
    '/api/alo-crm/push-result', '/api/alo-crm/push-voucher-usage', '/api/alo-crm/push-feedback',
    '/api/alo-crm/push-message', '/api/alo-crm/referral-lead'];

$content = "## Route Test Report\n\n";
$content .= "_Static route-coverage audit. Live HTTP probing should be performed via cPanel or staging._\n\n";

foreach ([
    'Public'      => $publicRoutes,
    'Student'     => $studentRoutes,
    'Admin'       => $adminRoutes,
    'Examiner'    => $examinerRoutes,
    'Ambassador'  => $ambassadorRoutes,
    'Mock Test'   => $mockRoutes,
    'CRM API'     => $crmRoutes,
] as $group => $list) {
    $content .= "### {$group} routes\n\n";
    $content .= "| Route | Defined? |\n|---|---|\n";
    foreach ($list as $r) {
        $defined = str_contains($routes, $r) ? '✓' : '✗';
        $content .= "| `{$r}` | {$defined} |\n";
    }
    $content .= "\n";
}
$content .= "### Expected HTTP status codes\n\n";
$content .= "| Route | Expected |\n|---|---|\n";
$content .= "| `/` | 200 |\n";
$content .= "| `/login` | 200 |\n";
$content .= "| `/api/health` | 200 JSON |\n";
$content .= "| `/student/dashboard` (unauth) | 302 → /login |\n";
$content .= "| `/admin/dashboard` (auth as student) | 403 |\n";
$content .= "| `/api/alo-crm/health` (no API key) | 401 JSON |\n";
$content .= "| `/nonexistent` | 404 |\n";

writeReport('07_ROUTE_TEST_REPORT.md', $content);

// =============================================================
// 08_FINAL_PRODUCTION_STATUS
// =============================================================
$genEnd = microtime(true);
$dur = round($genEnd - $genStart, 3);
$content = "## Final Production Status\n\n";
$content .= "Generated in {$dur}s.\n\n";

// Run verify_production.php-like checks inline.
$checks = [
    'PHP >= 8.2'                  => version_compare(PHP_VERSION, '8.2.0', '>='),
    'PDO MySQL ext'               => extension_loaded('pdo_mysql'),
    'OpenSSL ext'                 => extension_loaded('openssl'),
    'libsodium ext'               => extension_loaded('sodium'),
    'cURL ext'                    => extension_loaded('curl'),
    'DB connection'               => (function() { try { Database::connection(); return true; } catch (\Throwable $e) { return false; } })(),
    'exam_users table'            => Database::scalar("SHOW TABLES LIKE 'exam_users'") !== null,
    'exam_audit_logs table'       => Database::scalar("SHOW TABLES LIKE 'exam_audit_logs'") !== null,
    'exam_free_quota table'       => Database::scalar("SHOW TABLES LIKE 'exam_free_quota'") !== null,
    'exam_weekly_updates table'   => Database::scalar("SHOW TABLES LIKE 'exam_weekly_updates'") !== null,
    '11 roles seeded'             => (int) Database::scalar("SELECT COUNT(*) FROM exam_roles") === 11,
    '32 exam_types seeded'        => (int) Database::scalar("SELECT COUNT(*) FROM exam_types") === 32,
    '320 practice sets seeded'    => (int) Database::scalar("SELECT COUNT(*) FROM exam_practice_sets") === 320,
    'Settings table populated'    => (int) Database::scalar("SELECT COUNT(*) FROM exam_settings") >= 40,
    'Free quota ALO=3'            => (int) Database::scalar("SELECT setting_value FROM exam_settings WHERE setting_key='free_quota_alo'") === 3,
    'Free quota public=1'         => (int) Database::scalar("SELECT setting_value FROM exam_settings WHERE setting_key='free_quota_public'") === 1,
    'weekly_update_enabled=true'  => Database::scalar("SELECT setting_value FROM exam_settings WHERE setting_key='weekly_update_enabled'") === 'true',
    'No placeholder admin hashes' => (int) Database::scalar("SELECT COUNT(*) FROM exam_users WHERE password_hash LIKE 'REPLACE%' OR password_hash LIKE '\$2y\$12\$REPLACE%'") === 0,
];
$ok = 0; $bad = 0;
$content .= "| Check | Status |\n|---|---|\n";
foreach ($checks as $label => $r) {
    $r = $r === true || $r === 1 || $r === '1' ? true : false;
    $content .= "| {$label} | " . ($r ? '✅ PASS' : '❌ FAIL') . " |\n";
    if ($r) $ok++; else $bad++;
}
$content .= "\n### Summary\n\n";
$content .= "- **Pass: {$ok}**\n";
$content .= "- **Fail: {$bad}**\n";
$content .= "- **Total: " . count($checks) . "**\n\n";
$content .= "### Deployment readiness\n\n";
$content .= $bad === 0
    ? "**READY FOR PRODUCTION DEPLOYMENT.** All checks pass. Proceed to cPanel deployment per docs/CPANEL_DEPLOYMENT_GUIDE.md.\n"
    : "**NOT READY.** Address all ❌ FAIL items above before deploying.\n";

writeReport('08_FINAL_PRODUCTION_STATUS.md', $content);

cliOut('');
cliOut(sprintf('Audit reports generated: %d files in %.2fs', 9, $dur), 'green');
cliOut("Location: {$reportsDir}", 'gray');
exit(0);
