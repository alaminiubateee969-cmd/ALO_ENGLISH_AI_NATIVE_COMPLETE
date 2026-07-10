<?php
/**
 * app/Services/VoucherService.php — Voucher generation + redemption.
 *
 * Voucher types:
 *   free_attempt   — grants one attempt without consuming quota.
 *   discount       — % off the paid-attempt price.
 *   bundle         — N free attempts.
 *
 * Every generate / redeem / expire is audit-logged. Codes are 16-char
 * URL-safe base32. DB UNIQUE on voucher_code prevents collisions.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use RuntimeException;

final class VoucherService
{
    public const TYPE_FREE_ATTEMPT = 'free_attempt';
    public const TYPE_DISCOUNT     = 'discount';
    public const TYPE_BUNDLE       = 'bundle';

    /**
     * Generate one or more vouchers.
     *
     * @return array<int,string> generated codes
     */
    public static function generate(
        string $type,
        int $ownerUserId,
        int $usageLimit = 1,
        ?string $expiresAt = null,
        int $count = 1,
        ?int $ambassadorId = null,
        float $discountPercent = 0.0,
        int $bundleCount = 1
    ): array {
        if (!in_array($type, [self::TYPE_FREE_ATTEMPT, self::TYPE_DISCOUNT, self::TYPE_BUNDLE], true)) {
            throw new RuntimeException('Invalid voucher type.');
        }
        if ($count < 1 || $count > 500) {
            throw new RuntimeException('Count out of range (1..500).');
        }
        if ($expiresAt === null) {
            $days = (int) (getenv('VOUCHER_DEFAULT_EXPIRY_DAYS') ?: 90);
            $expiresAt = date('Y-m-d H:i:s', time() + $days * 86400);
        }

        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $code = self::generateCode();
            Database::insert('exam_vouchers', [
                'voucher_code'      => $code,
                'voucher_type'      => $type,
                'owner_user_id'     => $ownerUserId,
                'ambassador_id'     => $ambassadorId,
                'usage_limit'       => $usageLimit,
                'used_count'        => 0,
                'discount_percent'  => $discountPercent,
                'bundle_count'      => $bundleCount,
                'status'            => 'active',
                'expires_at'        => $expiresAt,
                'created_at'        => date('Y-m-d H:i:s'),
            ]);
            AuditService::log($ownerUserId, AuditService::ACTION_VOUCHER_GENERATE, 'voucher', null, [
                'code' => $code, 'type' => $type, 'expires_at' => $expiresAt,
            ]);
            $codes[] = $code;
        }
        return $codes;
    }

    /**
     * Validate that a voucher is redeemable by the given student.
     *
     * @return array{valid:bool, voucher?:array, reason?:string}
     */
    public static function validate(string $code, int $studentId): array
    {
        $code = strtoupper(trim($code));
        if ($code === '') {
            return ['valid' => false, 'reason' => 'Missing code.'];
        }
        $voucher = Database::one('SELECT * FROM exam_vouchers WHERE voucher_code = :c LIMIT 1', ['c' => $code]);
        if ($voucher === null) {
            return ['valid' => false, 'reason' => 'Voucher not found.'];
        }
        if ($voucher['status'] !== 'active') {
            return ['valid' => false, 'reason' => 'Voucher not active.'];
        }
        if ((int) $voucher['used_count'] >= (int) $voucher['usage_limit']) {
            return ['valid' => false, 'reason' => 'Voucher fully redeemed.'];
        }
        if (!empty($voucher['expires_at']) && strtotime((string) $voucher['expires_at']) < time()) {
            return ['valid' => false, 'reason' => 'Voucher expired.'];
        }
        return ['valid' => true, 'voucher' => $voucher];
    }

    /**
     * Consume a voucher for an attempt (inside caller's transaction).
     */
    public static function consume(string $code, int $attemptId, int $actorUserId): bool
    {
        return Database::transactional(function () use ($code, $attemptId, $actorUserId): bool {
            $voucher = Database::one('SELECT * FROM exam_vouchers WHERE voucher_code = :c FOR UPDATE', ['c' => strtoupper($code)]);
            if ($voucher === null) {
                return false;
            }
            if ((int) $voucher['used_count'] >= (int) $voucher['usage_limit']) {
                return false;
            }
            $newUsed = (int) $voucher['used_count'] + 1;
            $newStatus = $newUsed >= (int) $voucher['usage_limit'] ? 'redeemed' : 'active';
            Database::update('exam_vouchers', [
                'used_count' => $newUsed,
                'status'     => $newStatus,
                'updated_at' => date('Y-m-d H:i:s'),
            ], 'id = :id', ['id' => $voucher['id']]);

            Database::insert('exam_voucher_usage', [
                'voucher_id'    => $voucher['id'],
                'attempt_id'    => $attemptId,
                'user_id'       => $actorUserId,
                'used_at'       => date('Y-m-d H:i:s'),
            ]);

            AuditService::log($actorUserId, AuditService::ACTION_VOUCHER_REDEEM, 'voucher', $voucher['id'], [
                'code' => $code, 'attempt_id' => $attemptId,
            ]);
            return true;
        });
    }

    /**
     * Expire any vouchers past their expiry date.
     */
    public static function expire(): int
    {
        return Database::update('exam_vouchers', [
            'status'     => 'expired',
            'updated_at' => date('Y-m-d H:i:s'),
        ], 'status = :s AND expires_at IS NOT NULL AND expires_at < :now', [
            's' => 'active', 'now' => date('Y-m-d H:i:s'),
        ]);
    }

    private static function generateCode(): string
    {
        // RFC 4648 base32 (no 0/O/1/I) — URL-safe and human-readable.
        $alphabet = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
        $out = '';
        for ($i = 0; $i < 16; $i++) {
            $out .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            if ($i === 3 || $i === 7 || $i === 11) {
                $out .= '-'; // visual grouping
            }
        }
        $code = str_replace('-', '', $out);
        // Collision check (extremely unlikely).
        if (Database::exists('SELECT 1 FROM exam_vouchers WHERE voucher_code = :c', ['c' => $code])) {
            return self::generateCode();
        }
        return $code;
    }
}
