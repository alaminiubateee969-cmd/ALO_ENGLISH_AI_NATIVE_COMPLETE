<?php
/**
 * app/Middleware/AuthMiddleware.php — require a logged-in user.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Response;
use App\Services\RBACService;

final class AuthMiddleware
{
    public static function handle(): void
    {
        if (RBACService::currentUser() === null) {
            if (self::wantsJson()) {
                Response::json(['error' => 'Unauthorized'], 401);
            }
            Response::redirect('/login', 302);
        }
    }

    private static function wantsJson(): bool
    {
        $accept = strtolower((string) ($_SERVER['HTTP_ACCEPT'] ?? ''));
        return str_contains($accept, 'application/json')
            || str_starts_with((string) ($_SERVER['REQUEST_URI'] ?? ''), '/api/');
    }
}
