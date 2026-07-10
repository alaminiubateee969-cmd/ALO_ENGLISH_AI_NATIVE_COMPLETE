<?php
/**
 * /api/health.php — Standalone health endpoint.
 * Also accessible via front controller at /api/health.
 */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('X-Content-Type-Options: nosniff');

echo json_encode([
    'status' => 'ok',
    'platform' => 'ALO English Test Platform',
    'version' => '1.0.0',
    'php_version' => PHP_VERSION,
    'database' => 'not_checked_standalone',
    'timestamp' => date('c'),
    'env' => getenv('APP_ENV') ?: 'production',
    'practice_only' => true,
    'free_quota' => ['alo_students' => 3, 'public_students' => 1, 'enforced' => 'backend'],
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
