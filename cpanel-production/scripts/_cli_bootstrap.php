<?php
/**
 * scripts/_cli_bootstrap.php — Shared CLI bootstrap for management scripts.
 *
 * Loads env, registers the App\ autoloader (PSR-4), configures the DB.
 * All scripts in scripts/ MUST require this first.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "Management scripts must run from CLI.\n");
    exit(1);
}

error_reporting(E_ALL);
ini_set('display_errors', '1'); // CLI: show errors
date_default_timezone_set(getenv('APP_TIMEZONE') ?: 'Asia/Kolkata');

// Load .env (CLI overrides path via APP_ENV_FILE).
$envFile = getenv('APP_ENV_FILE') ?: '/home/aloeduca/config/english.env';
if (is_file($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }
        [$k, $v] = explode('=', $line, 2);
        $k = trim($k);
        $v = trim($v);
        if (strlen($v) >= 2 && $v[0] === '"' && substr($v, -1) === '"') {
            $v = substr($v, 1, -1);
        }
        putenv("{$k}={$v}");
        $_ENV[$k] = $v;
    }
}

// PSR-4 autoloader for App\ namespace.
spl_autoload_register(function (string $cls): void {
    $prefix = 'App\\';
    if (!str_starts_with($cls, $prefix)) {
        return;
    }
    $rel = substr($cls, strlen($prefix));
    $path = __DIR__ . '/../app/' . str_replace('\\', '/', $rel) . '.php';
    if (is_file($path)) {
        require $path;
    }
});

// Preload core classes explicitly (in case autoloader misses edge cases).
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
Database::configure(require __DIR__ . '/../config/database.php');

/** Print a colored line to STDOUT. */
function cliOut(string $msg, string $color = ''): void
{
    $codes = [
        'green'  => "\033[32m",
        'red'    => "\033[31m",
        'yellow' => "\033[33m",
        'cyan'   => "\033[36m",
        'gray'   => "\033[90m",
        'reset'  => "\033[0m",
    ];
    $start = $codes[$color] ?? '';
    $end   = $start === '' ? '' : $codes['reset'];
    fwrite(STDOUT, $start . $msg . $end . "\n");
}

function cliErr(string $msg): void
{
    fwrite(STDERR, "\033[31m" . $msg . "\033[0m\n");
}
