<?php
/**
 * views/admin/vouchers.php — Manage vouchers.
 * Expected vars: $vouchers (array), $user, $user_count. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Vouchers';
require __DIR__ . '/../layouts/header.php';
$vouchers = isset($vouchers) && is_array($vouchers) ? $vouchers : [
    ['code' => 'ALO-WELCOME-2025', 'type' => 'Free attempt', 'discount' => '1 free', 'issued' => '2025-01-01', 'expiry' => '2025-03-31', 'used' => '142 / 500', 'status' => 'active'],
    ['code' => 'AMB-2025-0042-V01', 'type' => 'Free attempt', 'discount' => '1 free', 'issued' => '2025-01-08', 'expiry' => '2025-04-08', 'used' => '1 / 3', 'status' => 'active'],
    ['code' => 'PARTNER-EDU-50',   'type' => 'Discount',     'discount' => '50%',    'issued' => '2024-12-15','expiry' => '2025-01-15','used' => '88 / 100','status' => 'expired'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Vouchers</h1>
        <p><a class="btn btn-primary" href="#">+ Issue voucher</a></p>
    </header>
    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>Code</th><th>Type</th><th>Discount</th><th>Issued</th><th>Expiry</th><th>Used</th><th>Status</th></tr></thead>
            <tbody>
                <?php foreach ($vouchers as $v): ?>
                    <tr>
                        <td class="alo-mono"><?= $e($v['code']) ?></td>
                        <td><?= $e($v['type']) ?></td>
                        <td><?= $e($v['discount']) ?></td>
                        <td class="alo-mono"><?= $e($v['issued']) ?></td>
                        <td class="alo-mono"><?= $e($v['expiry']) ?></td>
                        <td><?= $e($v['used']) ?></td>
                        <td>
                            <?php $cls = $v['status'] === 'active' ? 'success' : 'danger'; ?>
                            <span class="alo-badge alo-badge--<?= $cls ?>"><?= $e($v['status']) ?></span>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
