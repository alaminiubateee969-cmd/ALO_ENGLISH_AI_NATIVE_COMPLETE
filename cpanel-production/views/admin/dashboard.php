<?php
/**
 * views/admin/dashboard.php — Admin dashboard (demo data).
 *
 * Static demo content. Renders 200 with no DB.
 *
 * Expected vars:
 *   - $e (callable)
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Admin dashboard';
require __DIR__ . '/../layouts/header.php';

// Demo KPI cards
$kpis = [
    ['label' => 'Total students',         'value' => '1,284'],
    ['label' => 'Mock tests published',   'value' => '320'],
    ['label' => 'Submissions (30 days)',  'value' => '4,612'],
    ['label' => 'Pending reviews',        'value' => '38'],
];
// Demo pipeline chart data (printed as a simple CSS bar chart)
$chart = [
    ['Mon', 42], ['Tue', 55], ['Wed', 38], ['Thu', 71],
    ['Fri', 63], ['Sat', 24], ['Sun', 18],
];
$maxBar = max(array_column($chart, 1)) ?: 1;
// Demo audit log preview
$audit = [
    ['time' => '2025-01-15 14:02', 'actor' => 'admin@alo',   'action' => 'QUESTION_PUBLISH', 'target' => 'IELTS-A-SET-003'],
    ['time' => '2025-01-15 13:48', 'actor' => 'examiner@alo', 'action' => 'REVIEW_SUBMIT',    'target' => 'attempt #4821'],
    ['time' => '2025-01-15 13:30', 'actor' => 'system',       'action' => 'WEEKLY_UPDATE_RUN', 'target' => 'pipeline'],
    ['time' => '2025-01-15 12:55', 'actor' => 'admin@alo',    'action' => 'VOUCHER_ISSUE',     'target' => 'AMB-2025-0042'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Admin dashboard</h1>
        <p>Platform overview. <span class="alo-demo-tag">Demo data</span></p>
    </header>

    <div class="alo-grid alo-grid--4 alo-kpi">
        <?php foreach ($kpis as $kpi): ?>
            <article class="card alo-kpi__card">
                <span class="alo-kpi__label"><?= $e($kpi['label']) ?></span>
                <span class="alo-kpi__value"><?= $e($kpi['value']) ?></span>
            </article>
        <?php endforeach; ?>
    </div>

    <div class="alo-grid alo-grid--2 alo-dashboard-cols">
        <section class="card">
            <header class="alo-card__head">
                <h2>Submissions pipeline (last 7 days)</h2>
                <a class="btn btn-link" href="/admin/attempts">All attempts &rarr;</a>
            </header>
            <div class="alo-chart alo-chart--bars" aria-hidden="true">
                <?php foreach ($chart as $bar): ?>
                    <div class="alo-chart__col">
                        <div class="alo-chart__bar" style="height: <?= $e((string)round($bar[1] / $maxBar * 100)) ?>%;"></div>
                        <span class="alo-chart__label"><?= $e($bar[0]) ?></span>
                        <span class="alo-chart__num"><?= $e((string)$bar[1]) ?></span>
                    </div>
                <?php endforeach; ?>
            </div>
        </section>

        <section class="card">
            <header class="alo-card__head">
                <h2>Audit log preview</h2>
                <a class="btn btn-link" href="/admin/audit-logs">Full log &rarr;</a>
            </header>
            <div class="alo-table-wrap">
                <table class="alo-table alo-table--compact">
                    <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th></tr></thead>
                    <tbody>
                        <?php foreach ($audit as $row): ?>
                            <tr>
                                <td class="alo-mono"><?= $e($row['time']) ?></td>
                                <td><?= $e($row['actor']) ?></td>
                                <td><span class="alo-badge alo-badge--info"><?= $e($row['action']) ?></span></td>
                                <td class="alo-mono"><?= $e($row['target']) ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </section>
    </div>

    <div class="alo-grid alo-grid--3">
        <section class="card">
            <header class="alo-card__head"><h2>Quick actions</h2></header>
            <ul class="alo-linklist">
                <li><a href="/admin/question-bank">Question bank</a></li>
                <li><a href="/admin/questions">Approve questions</a></li>
                <li><a href="/admin/vouchers">Issue voucher</a></li>
                <li><a href="/admin/crm-sync">Run CRM sync</a></li>
                <li><a href="/admin/weekly-updates">Run weekly update</a></li>
            </ul>
        </section>
        <section class="card">
            <header class="alo-card__head"><h2>Pipeline health</h2></header>
            <ul class="alo-list">
                <li>Weekly update: <strong>idle</strong> (next run Monday 02:00)</li>
                <li>CRM sync queue: <strong>3 pending</strong></li>
                <li>Examiner review queue: <strong>38 pending</strong></li>
                <li>Backup: <strong>last OK 2025-01-15 03:00</strong></li>
            </ul>
        </section>
        <section class="card">
            <header class="alo-card__head"><h2>Recent reports</h2></header>
            <ul class="alo-linklist">
                <li><a href="/admin/scores">Score distribution</a></li>
                <li><a href="/admin/leads">Lead source breakdown</a></li>
                <li><a href="/admin/marketing">Ambassador performance</a></li>
                <li><a href="/admin/audit-logs">Security audit log</a></li>
            </ul>
        </section>
    </div>

    <div class="alo-disclaimer-banner" role="note">
        <strong>Practice only.</strong>
        All mock-test data on this Platform is original, exam-aligned practice
        material — not official exam content.
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
