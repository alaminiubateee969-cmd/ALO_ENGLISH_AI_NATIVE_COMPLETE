<?php
/**
 * views/student/vouchers.php — Student's vouchers.
 * Expected vars: $vouchers (array), $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Your vouchers';
require __DIR__ . '/../layouts/header.php';
$vouchers = isset($vouchers) && is_array($vouchers) ? $vouchers : [
    ['code' => 'ALO-WELCOME-2025', 'type' => 'Free attempt', 'discount' => '1 free', 'expiry' => '2025-03-31', 'used' => '0 / 1', 'status' => 'active'],
    ['code' => 'AMB-2025-0042-V01', 'type' => 'Free attempt', 'discount' => '1 free', 'expiry' => '2025-04-10', 'used' => '0 / 3', 'status' => 'active'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Your vouchers</h1>
        <p>Redeem a voucher when starting a practice test to use a free attempt.</p>
    </header>
    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>Code</th><th>Type</th><th>Discount</th><th>Expiry</th><th>Used</th><th>Status</th></tr></thead>
            <tbody>
                <?php foreach ($vouchers as $v): ?>
                    <tr>
                        <td class="alo-mono"><?= $e($v['code']) ?></td>
                        <td><?= $e($v['type']) ?></td>
                        <td><?= $e($v['discount']) ?></td>
                        <td class="alo-mono"><?= $e($v['expiry']) ?></td>
                        <td><?= $e($v['used']) ?></td>
                        <td><span class="alo-badge alo-badge--success"><?= $e($v['status']) ?></span></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
