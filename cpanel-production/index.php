<?php
/**
 * ALO English Test Platform — Front Controller (Document Root Entry Point)
 * --------------------------------------------------------------------------
 * This is the SINGLE public entry point for the platform. It bootstraps the
 * autoloader, loads config, configures the database (lazy), loads routes
 * and dispatches the request.
 *
 * PHP 8.2+ required.
 *
 * @package ALO\EnglishTestPlatform
 */

declare(strict_types=1);

/* -------------------------------------------------------------------------
 * 1. Constants
 * ------------------------------------------------------------------------- */
define('APP_ROOT', __DIR__);
define('APP_DEBUG', getenv('APP_DEBUG') === 'true');
define('APP_TIMEZONE', getenv('APP_TIMEZONE') ?: 'Asia/Dhaka');

date_default_timezone_set(APP_TIMEZONE);
mb_internal_encoding('UTF-8');

/* -------------------------------------------------------------------------
 * 2. Error handling — never leak internals in production
 * ------------------------------------------------------------------------- */
error_reporting(E_ALL);
ini_set('display_errors', APP_DEBUG ? '1' : '0');
ini_set('log_errors', '1');
ini_set('error_log', APP_ROOT . '/logs/php-error.log');

set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
    if (!(error_reporting() & $severity)) return false;
    throw new ErrorException($message, 0, $severity, $file, $line);
});

set_exception_handler(static function (\Throwable $e): void {
    @error_log('[alo-fatal] ' . $e->getMessage() . "\n" . $e->getTraceAsString());
    http_response_code(500);
    if (!headers_sent()) header('Content-Type: text/html; charset=utf-8');
    if (APP_DEBUG) {
        echo '<h1>Application Error</h1><pre>' . htmlspecialchars($e->getMessage()) . "\n\n" . htmlspecialchars($e->getTraceAsString()) . '</pre>';
    } else {
        echo '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Application Error</title></head><body><h1>Application Error</h1><p>The application could not be started. The incident has been logged.</p></body></html>';
    }
});

/* -------------------------------------------------------------------------
 * 3. Autoloader (no Composer required)
 * ------------------------------------------------------------------------- */
spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';
    if (!str_starts_with($class, $prefix)) return;
    $relative = str_replace('\\', '/', substr($class, strlen($prefix)));
    $candidates = [
        APP_ROOT . '/app/' . $relative . '.php',
        APP_ROOT . '/app/Core/' . basename($relative) . '.php',
    ];
    foreach ($candidates as $file) {
        if (is_file($file)) { require $file; return; }
    }
});

/* -------------------------------------------------------------------------
 * 4. Load .env (if present, outside public is ideal; local fallback here)
 * ------------------------------------------------------------------------- */
$envFile = getenv('ALO_ENV_FILE') ?: (dirname(APP_ROOT) . '/config/english.env');
if (!is_file($envFile)) $envFile = APP_ROOT . '/.env';
if (is_file($envFile) && is_readable($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (!str_contains($line, '=')) continue;
        [$k, $v] = explode('=', $line, 2);
        $k = trim($k); $v = trim($v, " \t\"'");
        if (getenv($k) === false) putenv($k . '=' . $v);
        $_ENV[$k] ??= $v;
    }
}

/* -------------------------------------------------------------------------
 * 5. Configure database (lazy — won't connect until first query)
 * ------------------------------------------------------------------------- */
$dbConfigFile = APP_ROOT . '/config/database.php';
if (is_file($dbConfigFile)) {
    $dbConfig = require $dbConfigFile;
    if (is_array($dbConfig)) {
        App\Core\Database::configure($dbConfig);
    }
}

/* -------------------------------------------------------------------------
 * 5b. Start session (required by CSRF + Auth)
 * ------------------------------------------------------------------------- */
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_set_cookie_params([
        'lifetime' => (int)(getenv('SESSION_LIFETIME') ?: 120) * 60,
        'path'     => '/',
        'secure'   => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (getenv('FORCE_HTTPS') === 'true'),
        'httponly' => true,
        'samesite' => getenv('SESSION_SAME_SITE') ?: 'Lax',
    ]);
    session_name('ALO_ENG_SID');
    session_start();
}

/* -------------------------------------------------------------------------
 * 6. Load routes + dispatch
 * ------------------------------------------------------------------------- */
$router = new App\Core\Router();

// Apply global middleware (CSRF on state-changing requests only)
$router->use(static function (): void {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
        // CSRF check for non-API, state-changing requests
        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        if (!str_starts_with($uri, '/api/')) {
            App\Middleware\CSRFMiddleware::handle();
        }
    }
});

$routesFile = APP_ROOT . '/app/routes.php';
if (is_file($routesFile)) {
    (require $routesFile)($router);
}

$router->dispatch();
