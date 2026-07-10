<?php
/**
 * app/Middleware/PermissionMiddleware.php — permission-based guard.
 *
 * Usage in routes: ['permission:english.students.manage']
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Response;
use App\Services\RBACService;

final class PermissionMiddleware
{
    public static function handle(string $permission): void
    {
        if (!RBACService::hasPermission($permission)) {
            if (self::wantsJson()) {
                Response::json(['error' => 'Forbidden', 'permission' => $permission], 403);
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
