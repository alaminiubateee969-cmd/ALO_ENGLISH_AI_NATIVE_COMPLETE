<?php
/**
 * views/ambassador/vouchers.php — Ambassador's issued vouchers.
 * Expected vars: $rows, $ctx. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Your vouchers';
require __DIR__ . '/../layouts/header.php';
$rows = isset($rows) && is_array($rows) ? $rows : [
    ['code' => 'AMB-2025-0042-V01', 'type' => 'Free attempt', 'discount' => '1 free', 'issued' => '2025-01-10', 'expiry' => '2025-04-10', 'used' => '1 / 3', 'status' => 'active'],
    ['code' => 'AMB-2025-0042-V02', 'type' => 'Discount 50%', 'discount' => '50%',    'issued' => '2025-01-08', 'expiry' => '2025-04-08', 'used' => '0 / 1', 'status' => 'active'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Your vouchers</h1>
        <p><a class="btn btn-primary" href="/ambassador/create-referral">+ Issue new</a></p>
    </header>
    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>Code</th><th>Type</th><th>Discount</th><th>Issued</th><th>Expiry</th><th>Used</th><th>Status</th></tr></thead>
            <tbody>
                <?php foreach ($rows as $row): ?>
                    <tr>
                        <td class="alo-mono"><?= $e($row['code']) ?></td>
                        <td><?= $e($row['type']) ?></td>
                        <td><?= $e($row['discount']) ?></td>
                        <td class="alo-mono"><?= $e($row['issued']) ?></td>
                        <td class="alo-mono"><?= $e($row['expiry']) ?></td>
                        <td><?= $e($row['used']) ?></td>
                        <td><span class="alo-badge alo-badge--success"><?= $e($row['status']) ?></span></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
