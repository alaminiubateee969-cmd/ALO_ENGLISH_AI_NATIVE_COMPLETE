<?php
/**
 * app/Middleware/CrmApiMiddleware.php — CRM server-to-server auth.
 *
 * Validates that the inbound request carries a valid X-Api-Key header
 * matching ALO_CRM_API_KEY from env. Constant-time comparison.
 * NEVER echoes the key. Logs every call to audit.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Response;
use App\Services\AuditService;

final class CrmApiMiddleware
{
    public static function handle(): void
    {
        $expected = (string) getenv('ALO_CRM_API_KEY');
        if ($expected === '') {
            AuditService::log(null, 'crm_api.unconfigured', 'system', null, []);
            Response::json(['error' => 'CRM API not configured'], 503);
        }
        $supplied = $_SERVER['HTTP_X_API_KEY'] ?? '';
        if (!is_string($supplied) || $supplied === '' || !hash_equals($expected, $supplied)) {
            AuditService::log(null, 'crm_api.unauthorized', 'system', null, []);
            Response::json(['error' => 'Unauthorized'], 401);
        }
        AuditService::log(null, 'crm_api.authorized', 'system', null, []);
    }
}
