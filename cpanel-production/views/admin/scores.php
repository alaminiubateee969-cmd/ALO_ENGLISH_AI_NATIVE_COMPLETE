<?php
/**
 * views/admin/scores.php — Score distribution.
 * Expected vars: $scores (array), $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Scores';
require __DIR__ . '/../layouts/header.php';
$scores = isset($scores) && is_array($scores) ? $scores : [
    ['exam' => 'IELTS-A', 'attempts' => 412, 'avg' => '6.4', 'median' => '6.5', 'top' => '8.5', 'pass_rate' => '68%'],
    ['exam' => 'PTE-A',   'attempts' => 318, 'avg' => '61',  'median' => '63',  'top' => '85',  'pass_rate' => '64%'],
    ['exam' => 'TOEFL-iBT','attempts' => 246, 'avg' => '82',  'median' => '85',  'top' => '112', 'pass_rate' => '72%'],
    ['exam' => 'SAT',     'attempts' => 158, 'avg' => '1180','median' => '1200','top' => '1480','pass_rate' => '70%'],
];
$kpis = [
    ['label' => 'Total attempts',  'value' => '4,612'],
    ['label' => 'Avg completion',  'value' => '94.2%'],
    ['label' => 'Auto-generated',  'value' => '4,583'],
    ['label' => 'Reviews requested','value' => '29'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head"><h1>Score distribution</h1></header>
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
            <thead><tr><th>Exam</th><th>Attempts</th><th>Average</th><th>Median</th><th>Top</th><th>Pass rate</th></tr></thead>
            <tbody>
                <?php foreach ($scores as $s): ?>
                    <tr>
                        <td><span class="alo-badge alo-badge--info"><?= $e($s['exam']) ?></span></td>
                        <td><?= $e((string)$s['attempts']) ?></td>
                        <td><?= $e($s['avg']) ?></td>
                        <td><?= $e($s['median']) ?></td>
                        <td><?= $e($s['top']) ?></td>
                        <td><?= $e($s['pass_rate']) ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
