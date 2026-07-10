<?php
/**
 * cron/_bootstrap.php — shared CLI bootstrap for cron jobs.
 *
 * Loads env, configures session-less PHP, opens DB connection, and
 * provides helpers: logLine(), lock(), unlock().
 *
 * Cron jobs are run via CLI: php cron/<job>.php
 * NEVER web-accessible — .htaccess blocks /cron/.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

// Cron jobs MUST be invoked from CLI only.
if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "Cron jobs must be run from CLI.\n");
    exit(1);
}

// Defensive defaults.
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('memory_limit', '512M');
date_default_timezone_set(getenv('APP_TIMEZONE') ?: 'Asia/Kolkata');

// Load .env from the canonical private location (OUTSIDE web root).
$envFile = getenv('APP_ENV_FILE') ?: '/home/aloeduca/config/english.env';
if (is_file($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        if (!str_contains($line, '=')) {
            continue;
        }
        [$k, $v] = explode('=', $line, 2);
        $k = trim($k);
        $v = trim($v);
        // Strip optional surrounding quotes.
        if (strlen($v) >= 2 && $v[0] === '"' && substr($v, -1) === '"') {
            $v = substr($v, 1, -1);
        }
        putenv("{$k}={$v}");
        $_ENV[$k] = $v;
    }
}

// Load app autoloader (PSR-4 App\ namespace).
require_once __DIR__ . '/../app/Core/Database.php';
require_once __DIR__ . '/../app/Core/Response.php';
require_once __DIR__ . '/../app/Core/Router.php';
require_once __DIR__ . '/../app/Services/AuditService.php';
require_once __DIR__ . '/../app/Services/AuthService.php';
require_once __DIR__ . '/../app/Services/RBACService.php';
require_once __DIR__ . '/../app/Services/CSRFService.php';
require_once __DIR__ . '/../app/Services/QuotaService.php';
require_once __DIR__ . '/../app/Services/ScoringService.php';
require_once __DIR__ . '/../app/Services/TestEngineService.php';
require_once __DIR__ . '/../app/Services/CRMIntegrationService.php';
require_once __DIR__ . '/../app/Services/VoucherService.php';
require_once __DIR__ . '/../app/Services/UploadService.php';

use App\Core\Database;

// Configure DB connection from config file.
Database::configure(require __DIR__ . '/../config/database.php');

/**
 * Append a line to logs/cron.log with timestamp + job name.
 */
function cronLog(string $job, string $message, string $level = 'INFO'): void
{
    $logPath = getenv('LOGS_PATH') ?: __DIR__ . '/../logs';
    if (!is_dir($logPath)) {
        @mkdir($logPath, 0700, true);
    }
    $line = sprintf("[%s] [%s] [%s] %s\n", date('Y-m-d H:i:s'), $level, $job, $message);
    file_put_contents($logPath . '/cron.log', $line, FILE_APPEND | LOCK_EX);
    // Also emit to stderr for cron-daemon mail.
    fwrite(STDERR, $line);
}

/**
 * Acquire an exclusive advisory lock so the job can't run twice in parallel.
 */
function cronLock(string $job): bool
{
    $pdo = Database::connection();
    $stmt = $pdo->prepare('SELECT GET_LOCK(:name, 0) AS got');
    $stmt->execute(['name' => 'cron_' . $job]);
    $row = $stmt->fetch();
    return isset($row['got']) && (int) $row['got'] === 1;
}

function cronUnlock(string $job): void
{
    try {
        $pdo = Database::connection();
        $stmt = $pdo->prepare('SELECT RELEASE_LOCK(:name)');
        $stmt->execute(['name' => 'cron_' . $job]);
    } catch (\Throwable $e) {
        // ignore
    }
}
