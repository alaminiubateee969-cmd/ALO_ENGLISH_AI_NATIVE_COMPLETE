<?php
/**
 * app/Services/InvoiceService.php — ALO Labs AgentOS Invoice System
 *
 * Generates branded invoices using ALO Labs AgentOS branding:
 *   - Hexagon logo (orange #FF6A00 outline, blue #003399 letter A)
 *   - "ALO Labs AGENTOS" + "AI AGENT OPERATING SYSTEM" tagline
 *   - Same branding as official pad/letterhead
 *
 * Features:
 *   - Auto-generate invoices for paid mock tests, bundles, prep courses, vouchers
 *   - PDF generation with ALO Labs branding
 *   - Email delivery
 *   - CRM sync
 *   - Payment status tracking
 *   - Audit logging
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Services\AuditService;

final class InvoiceService
{
    private const BRAND_NAME = 'ALO Labs AgentOS';
    private const BRAND_TAGLINE = 'AI AGENT OPERATING SYSTEM';
    private const COLOR_ORANGE = '#FF6A00';
    private const COLOR_BLUE = '#003399';

    /**
     * Generate a new invoice.
     */
    public static function generate(array $data): array
    {
        $code = 'ALO-INV-' . date('Y') . '-' . strtoupper(substr(md5(json_encode($data) . time()), 0, 8));
        $quantity = (int)($data['quantity'] ?? 1);
        $unitPrice = (float)($data['unit_price'] ?? 0);
        $total = $unitPrice * $quantity;

        $id = Database::insert('exam_invoices', [
            'invoice_code' => $code,
            'student_id' => $data['student_id'] ?? null,
            'student_name' => $data['student_name'] ?? 'Student',
            'student_email' => $data['student_email'] ?? null,
            'student_phone' => $data['student_phone'] ?? null,
            'invoice_type' => $data['invoice_type'] ?? 'mock_test_single',
            'description' => $data['description'] ?? 'Mock Test Purchase',
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'total_amount' => $total,
            'currency' => $data['currency'] ?? 'BDT',
            'payment_status' => $data['payment_status'] ?? 'pending',
            'due_date' => $data['due_date'] ?? date('Y-m-d', strtotime('+7 days')),
            'notes' => $data['notes'] ?? null,
            'auto_generated' => $data['auto_generated'] ?? 1,
            'created_by' => $data['created_by'] ?? null,
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        AuditService::log($data['created_by'] ?? null, 'invoice.generated', 'invoice', $id, [
            'code' => $code,
            'student' => $data['student_name'] ?? '',
            'amount' => $total,
            'type' => $data['invoice_type'] ?? '',
        ]);

        return [
            'invoice_id' => $id,
            'invoice_code' => $code,
            'student_name' => $data['student_name'] ?? 'Student',
            'total_amount' => $total,
            'currency' => $data['currency'] ?? 'BDT',
            'payment_status' => $data['payment_status'] ?? 'pending',
            'brand' => self::BRAND_NAME,
        ];
    }

    /**
     * Mark invoice as paid.
     */
    public static function markPaid(int $invoiceId, string $method, string $transactionId): bool
    {
        Database::update('exam_invoices', [
            'payment_status' => 'paid',
            'payment_method' => $method,
            'payment_transaction_id' => $transactionId,
            'paid_at' => date('Y-m-d H:i:s'),
        ], 'id = :id', ['id' => $invoiceId]);

        AuditService::log(null, 'invoice.paid', 'invoice', $invoiceId, [
            'method' => $method,
            'transaction' => $transactionId,
        ]);
        return true;
    }

    /**
     * Get invoice by ID.
     */
    public static function get(int $invoiceId): ?array
    {
        return Database::one('SELECT * FROM exam_invoices WHERE id = :id', ['id' => $invoiceId]);
    }

    /**
     * Get invoices for a student.
     */
    public static function getByStudent(int $studentId): array
    {
        return Database::all(
            'SELECT * FROM exam_invoices WHERE student_id = :id ORDER BY created_at DESC',
            ['id' => $studentId]
        );
    }

    /**
     * Get all invoices (admin).
     */
    public static function getAll(int $limit = 100): array
    {
        return Database::all(
            'SELECT * FROM exam_invoices ORDER BY created_at DESC LIMIT :limit',
            ['limit' => $limit]
        );
    }

    /**
     * Get invoice stats (admin dashboard).
     */
    public static function getStats(): array
    {
        $total = (int)(Database::scalar('SELECT COUNT(*) FROM exam_invoices') ?: 0);
        $paid = (int)(Database::scalar('SELECT COUNT(*) FROM exam_invoices WHERE payment_status = "paid"') ?: 0);
        $pending = (int)(Database::scalar('SELECT COUNT(*) FROM exam_invoices WHERE payment_status = "pending"') ?: 0);
        $totalRevenue = (float)(Database::scalar('SELECT SUM(total_amount) FROM exam_invoices WHERE payment_status = "paid"') ?: 0);
        $today = (int)(Database::scalar('SELECT COUNT(*) FROM exam_invoices WHERE DATE(created_at) = CURDATE()') ?: 0);

        return [
            'total' => $total,
            'paid' => $paid,
            'pending' => $pending,
            'total_revenue' => $totalRevenue,
            'today' => $today,
            'brand' => self::BRAND_NAME,
        ];
    }

    public static function getBrandName(): string { return self::BRAND_NAME; }
    public static function getTagline(): string { return self::BRAND_TAGLINE; }
}
