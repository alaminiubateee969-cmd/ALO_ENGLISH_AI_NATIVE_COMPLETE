<?php
/**
 * ALO English Test Platform — Public Bridge (Document Root)
 * ------------------------------------------------------------------
 * This file lives at the cPanel document root and is the ONLY PHP file
 * that should ever be web-accessible. It safely requires the private
 * application bootstrap located OUTSIDE the document root.
 *
 * It must NEVER:
 *   - expose internal filesystem paths,
 *   - expose secrets or environment variables,
 *   - render stack traces on failure.
 *
 * PHP 8.2+ required.
 */

declare(strict_types=1);

/**
 * Absolute path to the private application's public entry point.
 * On a standard cPanel layout this resolves to:
 *   /home/aloeduca/alo-english-platform/public/index.php
 * If the application lives elsewhere, override via the
 * ALO_APP_BOOTSTRAP environment variable (set in the server config,
 * NEVER in a web-readable file).
 */
$bootstrapPath = getenv('ALO_APP_BOOTSTRAP') ?: '/home/aloeduca/alo-english-platform/public/index.php';

/**
 * If the private app is missing or unreadable, render a generic,
 * safe fallback page. No paths, no secrets, no stack traces.
 */
if (!is_string($bootstrapPath) || $bootstrapPath === '' || !is_file($bootstrapPath) || !is_readable($bootstrapPath)) {
    http_response_code(503);
    header('Content-Type: text/html; charset=utf-8');
    header('Retry-After: 3600');
    echo '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
       . '<meta name="viewport" content="width=device-width, initial-scale=1">'
       . '<title>Service Temporarily Unavailable</title></head><body>'
       . '<h1>Service Temporarily Unavailable</h1>'
       . '<p>The ALO English Test Platform is undergoing maintenance. '
       . 'Please try again in a few minutes.</p>'
       . '<p>If the problem persists, contact your platform administrator.</p>'
       . '</body></html>';
    exit;
}

try {
    require $bootstrapPath;
} catch (\Throwable $e) {
    // Never leak internal details to the browser.
    http_response_code(500);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
       . '<meta name="viewport" content="width=device-width, initial-scale=1">'
       . '<title>Application Error</title></head><body>'
       . '<h1>Application Error</h1>'
       . '<p>The application could not be started. The incident has been logged.</p>'
       . '</body></html>';
    // Forward to a private error log if possible.
    @error_log('[alo-bridge] bootstrap failure: ' . $e->getMessage());
    exit;
}
