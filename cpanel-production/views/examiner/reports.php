<?php
/**
 * views/examiner/reports.php — Examiner performance reports.
 *
 * Expected vars:
 *   - $rows (array) report rows
 *   - $user (array)
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Examiner reports';
require __DIR__ . '/../layouts/header.php';
$rows = isset($rows) && is_array($rows) ? $rows : [
    ['period' => '2025-01 (W3)', 'reviews_done' => 42, 'avg_minutes' => 8.4, 'on_time_pct' => 96.2, 'accuracy_score' => '0.91'],
    ['period' => '2025-01 (W2)', 'reviews_done' => 38, 'avg_minutes' => 9.1, 'on_time_pct' => 94.1, 'accuracy_score' => '0.89'],
    ['period' => '2025-01 (W1)', 'reviews_done' => 51, 'avg_minutes' => 7.8, 'on_time_pct' => 98.0, 'accuracy_score' => '0.93'],
];
$kpis = [
    ['label' => 'Reviews this month', 'value' => '131'],
    ['label' => 'Avg review time',    'value' => '8.4 min'],
    ['label' => 'On-time rate',       'value' => '96.1%'],
    ['label' => 'Accuracy',           'value' => '0.91'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Examiner reports</h1>
        <p>Your review performance over time. <span class="alo-demo-tag">Demo data</span></p>
    </header>

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
            <thead><tr><th>Period</th><th>Reviews</th><th>Avg time</th><th>On-time</th><th>Accuracy</th></tr></thead>
            <tbody>
                <?php foreach ($rows as $row): ?>
                    <tr>
                        <td class="alo-mono"><?= $e($row['period']) ?></td>
                        <td><?= $e((string)$row['reviews_done']) ?></td>
                        <td><?= $e((string)$row['avg_minutes']) ?> min</td>
                        <td><?= $e((string)$row['on_time_pct']) ?>%</td>
                        <td><?= $e($row['accuracy_score']) ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <div class="alo-disclaimer-banner" role="note">
        <strong>Practice only.</strong> Reviews cover original practice material — not official exam content.
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
