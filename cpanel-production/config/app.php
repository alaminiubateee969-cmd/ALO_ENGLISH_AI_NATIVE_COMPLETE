<?php
/**
 * config/app.php — Application configuration.
 *
 * Returns a single array read by the bootstrap. All values come from
 * the environment (via getenv) so no secrets are ever committed.
 * PHP 8.2+.
 */

declare(strict_types=1);

return [
    // Display name used in headers, emails, and reports.
    'app_name'  => getenv('APP_NAME') ?: 'ALO English Test Platform',

    // production | staging | development
    'env'       => getenv('APP_ENV') ?: 'production',

    // NEVER enable in production. Hardened: forces false unless explicitly 'true'.
    'debug'     => getenv('APP_DEBUG') === 'true',

    // Canonical base URL (no trailing slash).
    'url'       => rtrim((string)(getenv('APP_URL') ?: 'https://english.aloeducation.com'), '/'),

    // Default timezone for all date operations.
    'timezone'  => getenv('APP_TIMEZONE') ?: 'Asia/Kolkata',

    // 32-byte base64 key. Required for CSRF + signed URLs.
    'key'       => (string)(getenv('APP_KEY') ?: ''),

    // Default locale.
    'locale'    => getenv('DEFAULT_LOCALE') ?: 'en',

    'session' => [
        'name'              => getenv('SESSION_NAME') ?: 'alo_english_session',
        'lifetime'          => (int)(getenv('SESSION_LIFETIME') ?: 120),
        'cookie_path'       => getenv('SESSION_COOKIE_PATH') ?: '/',
        'cookie_domain'     => getenv('SESSION_COOKIE_DOMAIN') ?: '',
        'cookie_secure'     => getenv('SESSION_COOKIE_SECURE') !== 'false', // default true
        'cookie_httponly'   => getenv('SESSION_COOKIE_HTTPONLY') !== 'false',
        'cookie_samesite'   => getenv('SESSION_COOKIE_SAMESITE') ?: 'Lax',
        'regenerate_on_login' => getenv('SESSION_REGENERATE_ON_LOGIN') !== 'false',
    ],

    'security' => [
        'login_max_attempts'    => (int)(getenv('LOGIN_MAX_ATTEMPTS') ?: 5),
        'login_lockout_minutes' => (int)(getenv('LOGIN_LOCKOUT_MINUTES') ?: 15),
        'password_min_length'   => (int)(getenv('PASSWORD_MIN_LENGTH') ?: 12),
        'password_require_special' => getenv('PASSWORD_REQUIRE_SPECIAL') !== 'false',
        'mfa_enabled'           => getenv('MFA_ENABLED') !== 'false',
    ],

    'cors' => [
        'allowed_origins' => array_filter(array_map('trim', explode(',', (string)(getenv('CORS_ALLOWED_ORIGINS') ?: '')))),
    ],

    'trusted_proxies' => array_filter(array_map('trim', explode(',', (string)(getenv('TRUSTED_PROXIES') ?: '')))),
];
