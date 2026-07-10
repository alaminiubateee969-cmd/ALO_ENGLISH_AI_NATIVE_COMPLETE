<?php
/**
 * app/Services/UploadService.php — Secure file upload handler.
 *
 *   - Validates MIME type AND extension against allow-lists.
 *   - Generates a safe random filename (no user-supplied chars).
 *   - Stores under storage/{type}/ — OUTSIDE the web root.
 *   - Never allows PHP execution (UploadService stores, .htaccess blocks).
 *   - Blocks path traversal (no ../ in stored paths).
 *   - Writes a row to exam_uploads with metadata + audit.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use RuntimeException;

final class UploadService
{
    public const TYPE_DOCUMENT = 'document';
    public const TYPE_AUDIO    = 'audio';
    public const TYPE_VIDEO    = 'video';

    /**
     * Handle a single $_FILES[x] upload.
     *
     * @param array  $file           $_FILES entry
     * @param string $type           document|audio|video
     * @param int    $ownerUserId    Uploading user
     * @param string $purpose        free-text purpose tag (e.g. 'speaking_response')
     * @return array{path:string, url_safe_name:string, size:int, mime:string, upload_id:int}
     * @throws RuntimeException on any validation failure.
     */
    public static function handleUpload(array $file, string $type, int $ownerUserId, string $purpose = 'general'): array
    {
        if (!in_array($type, [self::TYPE_DOCUMENT, self::TYPE_AUDIO, self::TYPE_VIDEO], true)) {
            throw new RuntimeException('Invalid upload type.');
        }

        $cfg = require __DIR__ . '/../../config/exams.php';
        $rules = $cfg['uploads'][$type] ?? null;
        if ($rules === null) {
            throw new RuntimeException('Upload rules not configured.');
        }

        // Basic sanity
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            throw new RuntimeException('No valid uploaded file.');
        }
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new RuntimeException('Upload error code: ' . $file['error']);
        }

        $size = (int) $file['size'];
        $maxBytes = $rules['max_size_mb'] * 1024 * 1024;
        if ($size <= 0 || $size > $maxBytes) {
            throw new RuntimeException('File size out of allowed range.');
        }

        // MIME check — use finfo (server-side, not client-trusted).
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = (string) finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        if (!in_array($mime, $rules['allowed_mimes'], true)) {
            throw new RuntimeException('Disallowed file type.');
        }

        // Extension check
        $ext = strtolower((string) pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));
        if (!in_array($ext, $rules['allowed_extensions'], true)) {
            throw new RuntimeException('Disallowed file extension.');
        }

        // Hard block on anything PHP-ish, even if MIME lies.
        $blocked = ['php', 'phtml', 'phps', 'phar', 'cgi', 'pl', 'py', 'sh', 'asp', 'aspx', 'jsp', 'htaccess'];
        if (in_array($ext, $blocked, true)) {
            throw new RuntimeException('Forbidden extension.');
        }

        // Build safe storage path (OUTSIDE web root).
        $storageRoot = rtrim((string) $cfg['uploads']['storage_root'], '/');
        $relativeDir = $type . '/' . date('Y/m');
        $absDir = $storageRoot . '/' . $relativeDir;
        if (!is_dir($absDir) && !mkdir($absDir, 0700, true) && !is_dir($absDir)) {
            throw new RuntimeException('Storage directory unavailable.');
        }
        // Final directory hardening — drop a .htaccess refusing PHP execution.
        @file_put_contents($absDir . '/.htaccess', "php_flag engine off\n<FilesMatch \"\\.(php|phtml|phps|phar)$\">Require all denied</FilesMatch>\n");

        // Generate a random filename — no user input used.
        $rand = sodium_bin2hex(random_bytes(16));
        $safeName = $rand . '.' . $ext;
        $absPath = $absDir . '/' . $safeName;
        $storedRelPath = $relativeDir . '/' . $safeName;

        if (!move_uploaded_file($file['tmp_name'], $absPath)) {
            throw new RuntimeException('Failed to store uploaded file.');
        }
        chmod($absPath, 0640);

        // Record metadata in DB.
        $uploadId = Database::insert('exam_uploads', [
            'owner_user_id'   => $ownerUserId,
            'file_name'       => $safeName,
            'original_name'   => mb_substr((string) $file['name'], 0, 255),
            'stored_path'     => $storedRelPath,
            'mime_type'       => $mime,
            'extension'       => $ext,
            'size_bytes'      => $size,
            'purpose'         => $purpose,
            'checksum_sha256' => hash_file('sha256', $absPath) ?: '',
            'created_at'      => date('Y-m-d H:i:s'),
        ]);

        AuditService::log($ownerUserId, AuditService::ACTION_FILE_UPLOAD, 'upload', $uploadId, [
            'type' => $type, 'mime' => $mime, 'size' => $size, 'purpose' => $purpose,
        ]);

        return [
            'path'          => $storedRelPath,
            'url_safe_name' => $safeName,
            'size'          => $size,
            'mime'          => $mime,
            'upload_id'     => $uploadId,
        ];
    }

    /**
     * Resolve a stored path back to an absolute filesystem path.
     * Verifies no path traversal.
     */
    public static function resolvePath(string $storedRelPath): string
    {
        $cfg = require __DIR__ . '/../../config/exams.php';
        $root = rtrim((string) $cfg['uploads']['storage_root'], '/');
        $clean = ltrim($storedRelPath, '/');

        // Block any traversal attempts.
        if (str_contains($clean, '..') || str_contains($clean, "\0")) {
            throw new RuntimeException('Invalid path.');
        }

        $abs = $root . '/' . $clean;
        $realRoot = realpath($root);
        $realAbs = realpath($abs);
        if ($realRoot === false || $realAbs === false || !str_starts_with($realAbs, $realRoot)) {
            throw new RuntimeException('Path escape blocked.');
        }
        return $realAbs;
    }
}
