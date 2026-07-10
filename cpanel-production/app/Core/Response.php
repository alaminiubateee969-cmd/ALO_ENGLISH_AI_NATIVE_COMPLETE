<?php
/**
 * app/Core/Response.php — HTTP response helpers.
 *
 * Provides:
 *   - json(payload, status)  JSON with proper headers + charset
 *   - redirect(to, status)   302/301 redirect with optional flash
 *   - view(template, data)   Render a PHP view from views/
 *   - text(body, status)     Plain text
 *   - abort(status, message) Halt with status code
 *   - download(stream)       Stream a file with safe headers
 *
 * All HTML output MUST be escaped at the view layer using e().
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Core;

use RuntimeException;

final class Response
{
    public static function json(array|object $data, int $status = 200): never
    {
        if (!headers_sent()) {
            http_response_code($status);
            header('Content-Type: application/json; charset=utf-8');
            header('X-Content-Type-Options: nosniff');
            header('Cache-Control: no-cache, no-store, must-revalidate');
            header('Pragma: no-cache');
        }
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        exit;
    }

    public static function redirect(string $to, int $status = 302): never
    {
        if (!headers_sent()) {
            http_response_code($status);
            header('Location: ' . $to, replace: true);
        }
        exit;
    }

    public static function text(string $body, int $status = 200): never
    {
        if (!headers_sent()) {
            http_response_code($status);
            header('Content-Type: text/plain; charset=utf-8');
        }
        echo $body;
        exit;
    }

    public static function abort(int $status, string $message = ''): never
    {
        http_response_code($status);
        if ($message === '') {
            $message = self::defaultMessage($status);
        }
        // Render a simple error page — no paths, no stack traces.
        header('Content-Type: text/html; charset=utf-8');
        echo '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
           . '<meta name="viewport" content="width=device-width, initial-scale=1">'
           . '<title>' . (int) $status . ' — ' . htmlspecialchars($message, ENT_QUOTES, 'UTF-8')
           . '</title></head><body>'
           . '<h1>' . (int) $status . '</h1>'
           . '<p>' . htmlspecialchars($message, ENT_QUOTES, 'UTF-8') . '</p>'
           . '</body></html>';
        exit;
    }

    /**
     * Render a PHP view.
     *
     * @param string                $template Path relative to views/, e.g. 'student/dashboard'
     * @param array<string,mixed>   $data     Variables extracted into the view scope
     */
    public static function view(string $template, array $data = [], int $status = 200): never
    {
        $path = __DIR__ . '/../../views/' . $template . '.php';
        if (!is_file($path)) {
            // Fall back to a generic 500 — never reveal the missing path to users.
            self::abort(500, 'View not available.');
        }

        if (!headers_sent()) {
            http_response_code($status);
            header('Content-Type: text/html; charset=utf-8');
        }

        // Make helper available in views.
        $e = [self::class, 'escape'];

        extract($data, EXTR_SKIP);
        require $path;
        exit;
    }

    /**
     * Escape a string for safe HTML output.
     * Usage in views: <?= $e($user['name']) ?>
     */
    public static function escape(mixed $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8');
    }

    /**
     * Stream a file to the browser with safe headers (no path disclosure).
     * The file path is never reflected back to the client.
     */
    public static function download(string $absPath, string $displayName, string $mime = 'application/octet-stream'): never
    {
        if (!is_file($absPath) || !is_readable($absPath)) {
            self::abort(404, 'File not found.');
        }

        // Final safety: never serve a PHP file or anything executable.
        $ext = strtolower((string) pathinfo($absPath, PATHINFO_EXTENSION));
        if (in_array($ext, ['php', 'phtml', 'phps', 'phar', 'cgi', 'pl', 'py', 'sh'], true)) {
            self::abort(403, 'Forbidden.');
        }

        $size = filesize($absPath);
        if (!headers_sent()) {
            http_response_code(200);
            header('Content-Type: ' . $mime);
            header('Content-Length: ' . (string) $size);
            header('Content-Disposition: attachment; filename="' . str_replace('"', '', $displayName) . '"');
            header('Cache-Control: private, no-cache, no-store, must-revalidate');
            header('Pragma: no-cache');
            header('X-Content-Type-Options: nosniff');
        }

        $handle = fopen($absPath, 'rb');
        if ($handle === false) {
            self::abort(500, 'File read error.');
        }
        while (!feof($handle)) {
            echo fread($handle, 64 * 1024);
            flush();
        }
        fclose($handle);
        exit;
    }

    private static function defaultMessage(int $status): string
    {
        return match ($status) {
            400 => 'Bad Request',
            401 => 'Unauthorized',
            403 => 'Forbidden',
            404 => 'Not Found',
            405 => 'Method Not Allowed',
            409 => 'Conflict',
            422 => 'Unprocessable Entity',
            429 => 'Too Many Requests',
            500 => 'Internal Server Error',
            503 => 'Service Unavailable',
            default => 'Error',
        };
    }
}
