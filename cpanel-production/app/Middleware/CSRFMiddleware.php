<?php
/**
 * app/Middleware/CSRFMiddleware.php — verify CSRF token on unsafe verbs.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Middleware;

use App\Services\CSRFService;

final class CSRFMiddleware
{
    public static function handle(): void
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        if (!in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return;
        }
        // Token may be in form body or X-CSRF-Token header.
        $token = $_POST[CSRFService::FIELD_NAME]
            ?? $_SERVER['HTTP_X_CSRF_TOKEN']
            ?? $_SERVER['HTTP_X_XSRF_TOKEN']
            ?? null;
        CSRFService::verify(is_string($token) ? $token : null);
    }
}
