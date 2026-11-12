<?php
/**
 * views/ambassador/commission.php — Commission summary and history.
 * Expected vars: $rows, $total, $paid, $ctx. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Commission';
require __DIR__ . '/../layouts/header.php';
$total = isset($total) ? $total : '128.50';
$paid  = isset($paid) ? $paid : '90.00';
$rows = isset($rows) && is_array($rows) ? $rows : [
    ['date' => '2025-01-15', 'student' => 'Rohit Das',    'event' => 'Conversion',   'amount' => '$8.00',  'status' => 'paid'],
    ['date' => '2025-01-12', 'student' => 'Sadia Islam',  'event' => 'First attempt','amount' => '$3.00',  'status' => 'paid'],
    ['date' => '2025-01-09', 'student' => 'Imran Khan',   'event' => 'First attempt','amount' => '$1.50',  'status' => 'pending'],
];
$kpis = [
    ['label' => 'Total earned',  'value' => '$' . $total],
    ['label' => 'Paid out',      'value' => '$' . $paid],
    ['label' => 'Pending',       'value' => '$' . number_format((float)$total - (float)$paid, 2)],
    ['label' => 'Conversion rate','value' => '32%'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head"><h1>Commission</h1></header>
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
            <thead><tr><th>Date</th><th>Student</th><th>Event</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
                <?php foreach ($rows as $row): ?>
                    <tr>
                        <td class="alo-mono"><?= $e($row['date']) ?></td>
                        <td><?= $e($row['student']) ?></td>
                        <td><?= $e($row['event']) ?></td>
                        <td><?= $e($row['amount']) ?></td>
                        <td>
                            <?php $cls = $row['status'] === 'paid' ? 'success' : 'warn'; ?>
                            <span class="alo-badge alo-badge--<?= $cls ?>"><?= $e($row['status']) ?></span>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
