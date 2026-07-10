<?php
/**
 * app/Middleware/RoleMiddleware.php — role-based guard.
 *
 * Usage in routes: ['role:ADMIN,SUPER_ADMIN']
 * The Router parses 'role:ADMIN' into this class's handle() call with
 * the comma-separated role list in $argv.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Response;
use App\Services\RBACService;

final class RoleMiddleware
{
    public static function handle(string ...$roles): void
    {
        if (!RBACService::hasRole(...$roles)) {
            if (self::wantsJson()) {
                Response::json(['error' => 'Forbidden'], 403);
            }
            Response::abort(403, 'You do not have permission to access this page.');
        }
    }

    private static function wantsJson(): bool
    {
        $accept = strtolower((string) ($_SERVER['HTTP_ACCEPT'] ?? ''));
        return str_contains($accept, 'application/json')
            || str_starts_with((string) ($_SERVER['REQUEST_URI'] ?? ''), '/api/');
    }
}
