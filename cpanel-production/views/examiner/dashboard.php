<?php
/**
 * views/examiner/dashboard.php — Examiner dashboard (demo data).
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
$title = 'Examiner dashboard';
require __DIR__ . '/../layouts/header.php';

$kpis = [
    ['label' => 'Writing queue',         'value' => '21'],
    ['label' => 'Speaking queue',        'value' => '17'],
    ['label' => 'Reviewed (7 days)',     'value' => '64'],
    ['label' => 'Avg. review time',      'value' => '6.2 min'],
];
$queue = [
    ['id' => 4821, 'type' => 'Writing', 'exam' => 'IELTS Academic', 'student' => 'stu_1012', 'submitted' => '2025-01-15 09:21'],
    ['id' => 4820, 'type' => 'Speaking', 'exam' => 'PTE Academic', 'student' => 'stu_0988', 'submitted' => '2025-01-15 09:10'],
    ['id' => 4819, 'type' => 'Writing', 'exam' => 'TOEFL iBT',     'student' => 'stu_1024', 'submitted' => '2025-01-15 08:54'],
    ['id' => 4818, 'type' => 'Speaking', 'exam' => 'Duolingo',     'student' => 'stu_0991', 'submitted' => '2025-01-15 08:42'],
    ['id' => 4817, 'type' => 'Writing', 'exam' => 'OET',           'student' => 'stu_1045', 'submitted' => '2025-01-15 08:30'],
];
$metrics = [
    ['label' => 'Inter-rater agreement', 'value' => '0.92'],
    ['label' => 'Rubric adherence',      'value' => '94%'],
    ['label' => 'Student satisfaction',  'value' => '4.7 / 5'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Examiner dashboard</h1>
        <p>Your review queue and performance metrics. <span class="alo-demo-tag">Demo data</span></p>
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
                <h2>Review queue</h2>
                <a class="btn btn-link" href="/examiner/writing-queue">Open queue &rarr;</a>
            </header>
            <div class="alo-table-wrap">
                <table class="alo-table alo-table--compact">
                    <thead>
                        <tr><th>ID</th><th>Type</th><th>Exam</th><th>Student</th><th>Submitted</th><th></th></tr>
                    </thead>
                    <tbody>
                        <?php foreach ($queue as $row): ?>
                            <tr>
                                <td class="alo-mono">#<?= $e((string)$row['id']) ?></td>
                                <td><?= $e($row['type']) ?></td>
                                <td><?= $e($row['exam']) ?></td>
                                <td class="alo-mono"><?= $e($row['student']) ?></td>
                                <td class="alo-mono"><?= $e($row['submitted']) ?></td>
                                <td>
                                    <a class="btn btn-primary btn-sm"
                                       href="/examiner/reviews">Review</a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </section>

        <section class="card">
            <header class="alo-card__head"><h2>Performance metrics</h2></header>
            <ul class="alo-list alo-list--big">
                <?php foreach ($metrics as $m): ?>
                    <li>
                        <span><?= $e($m['label']) ?></span>
                        <strong><?= $e($m['value']) ?></strong>
                    </li>
                <?php endforeach; ?>
            </ul>
            <h3>Recent reviews</h3>
            <ul class="alo-list">
                <li>#4815 — IELTS Academic — Writing — Band 6.5</li>
                <li>#4812 — PTE Academic — Speaking — 73</li>
                <li>#4808 — TOEFL iBT — Writing — 24/30</li>
            </ul>
        </section>
    </div>

    <div class="alo-disclaimer-banner" role="note">
        <strong>Practice only.</strong>
        All reviews are for original ALO practice content. Estimated scores are
        not official exam results and are not shared with any test publisher.
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
