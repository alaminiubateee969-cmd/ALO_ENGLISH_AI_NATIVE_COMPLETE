<?php
/**
 * app/Services/CSRFService.php — CSRF token generation + verification.
 *
 * Token is stored in $_SESSION and rotated every 2 hours. Hidden-field
 * helper renders the input element. All POST/PUT/DELETE routes must
 * verify via CSRFMiddleware which calls verify().
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

use RuntimeException;

final class CSRFService
{
    public const TOKEN_KEY  = '_csrf_token';
    public const FIELD_NAME = '_csrf_token';
    private const MAX_AGE_SECONDS = 7200; // 2 hours

    public static function token(): string
    {
        self::ensureSession();
        $now = time();
        $token = $_SESSION[self::TOKEN_KEY]['value'] ?? null;
        $issuedAt = $_SESSION[self::TOKEN_KEY]['issued_at'] ?? 0;

        if ($token === null || ($now - $issuedAt) > self::MAX_AGE_SECONDS) {
            $token = sodium_bin2hex(random_bytes(32));
            $_SESSION[self::TOKEN_KEY] = ['value' => $token, 'issued_at' => $now];
        }
        return $token;
    }

    /**
     * Verify a supplied token. Constant-time comparison via hash_equals.
     * Returns true on success; aborts with 419 on failure.
     */
    public static function verify(?string $supplied): void
    {
        self::ensureSession();
        $stored = $_SESSION[self::TOKEN_KEY]['value'] ?? '';
        $issuedAt = $_SESSION[self::TOKEN_KEY]['issued_at'] ?? 0;

        if ($stored === '' || $supplied === null || $supplied === '') {
            self::fail();
        }
        if ((time() - $issuedAt) > self::MAX_AGE_SECONDS) {
            self::fail();
        }
        if (!hash_equals($stored, (string) $supplied)) {
            self::fail();
        }
    }

    /** Render an <input type="hidden" name="_csrf_token" value="..."> */
    public static function hiddenField(): string
    {
        $token = self::token();
        return '<input type="hidden" name="' . self::FIELD_NAME . '" value="'
             . htmlspecialchars($token, ENT_QUOTES, 'UTF-8') . '">';
    }

    /** Render a meta tag for JS-driven POSTs (fetch + header). */
    public static function metaTag(): string
    {
        return '<meta name="csrf-token" content="'
             . htmlspecialchars(self::token(), ENT_QUOTES, 'UTF-8') . '">';
    }

    private static function ensureSession(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            // Session must be started by bootstrap; if not, refuse to operate.
            throw new RuntimeException('Session not active for CSRFService.');
        }
    }

    private static function fail(): never
    {
        http_response_code(419); // Authentication Timeout — common CSRF code
        header('Content-Type: text/html; charset=utf-8');
        echo '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
           . '<title>Session Expired</title></head><body>'
           . '<h1>Session Expired</h1>'
           . '<p>Your session has expired. Please go back, refresh the page, and try again.</p>'
           . '<p><a href="/">Return home</a></p>'
           . '</body></html>';
        exit;
    }
}
