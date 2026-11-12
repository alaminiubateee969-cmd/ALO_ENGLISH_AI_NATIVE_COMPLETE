<?php
/**
 * views/ambassador/reports.php — Ambassador performance report.
 * Expected vars: $rows, $ctx. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Ambassador report';
require __DIR__ . '/../layouts/header.php';
$rows = isset($rows) && is_array($rows) ? $rows : [
    ['period' => '2025-01', 'referrals' => 8, 'joined' => 5, 'converted' => 2, 'earnings' => '$42.50'],
    ['period' => '2024-12', 'referrals' => 12, 'joined' => 9, 'converted' => 4, 'earnings' => '$86.00'],
    ['period' => '2024-11', 'referrals' => 6,  'joined' => 4, 'converted' => 1, 'earnings' => '$18.00'],
];
$kpis = [
    ['label' => 'Total referrals',  'value' => '26'],
    ['label' => 'Conversion rate',  'value' => '27%'],
    ['label' => 'Avg earnings/mo',  'value' => '$48.83'],
    ['label' => 'Rank this month',  'value' => '#3'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head"><h1>Performance report</h1></header>
    <div class="alo-grid alo-grid--4 alo-kpi">
        <?php foreach ($kpis as $kpi): ?>
            <article class="card alo-kpi__card">
                <span class="alo-kpi__label"><?= $e($kpi['label']) ?></span>
                <span class="alo-kpi__value"><?= $e($kpi['value']) ?></span>
            </article>
        <?php endforeach; ?>
    </div>
    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>Period</th><th>Referrals</th><th>Joined</th><th>Converted</th><th>Earnings</th></tr></thead>
            <tbody>
                <?php foreach ($rows as $row): ?>
                    <tr>
                        <td class="alo-mono"><?= $e($row['period']) ?></td>
                        <td><?= $e((string)$row['referrals']) ?></td>
                        <td><?= $e((string)$row['joined']) ?></td>
                        <td><?= $e((string)$row['converted']) ?></td>
                        <td><?= $e($row['earnings']) ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
