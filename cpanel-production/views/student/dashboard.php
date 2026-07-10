<?php
/**
 * views/student/dashboard.php — Student dashboard (demo data).
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
$title = 'Student dashboard';
require __DIR__ . '/../layouts/header.php';

// Demo data — replaced by real DB rows in production.
$kpi = [
    ['label' => 'Free mocks available', 'value' => '2 / 3'],
    ['label' => 'Tests attempted',       'value' => '7'],
    ['label' => 'Best estimated score',  'value' => 'Band 7.5'],
];
$recent = [
    ['set' => 'IELTS-A-SET-003', 'exam' => 'IELTS Academic', 'score' => 'Band 7.5', 'date' => '2025-01-12', 'status' => 'Scored'],
    ['set' => 'PTE-A-SET-001',   'exam' => 'PTE Academic',   'score' => '78',       'date' => '2025-01-08', 'status' => 'Scored'],
    ['set' => 'TOEFL-IBT-SET-002','exam' => 'TOEFL iBT',      'score' => '102',      'date' => '2025-01-03', 'status' => 'Scored'],
    ['set' => 'DUOLINGO-SET-004','exam' => 'Duolingo',         'score' => '—',        'date' => '2025-01-15', 'status' => 'In review'],
];
$profileStrength = 78;
$aiNextAction = 'Focus on Writing Task 2 — your last 3 essays scored below your Reading score. Try the PTE-A-SET-002 Write From Dictation pack next.';
$appointments = [
    ['title' => 'Speaking review session', 'when' => '2025-01-22 16:00', 'with' => 'Examiner M. Hossain'],
    ['title' => 'Counsellor 1-on-1',       'when' => '2025-01-25 11:00', 'with' => 'Counsellor R. Ahmed'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Student dashboard</h1>
        <p>Welcome back. Here is your practice snapshot. <span class="alo-demo-tag">Demo data</span></p>
    </header>

    <div class="alo-grid alo-grid--3 alo-kpi">
        <?php foreach ($kpi as $card): ?>
            <article class="card alo-kpi__card">
                <span class="alo-kpi__label"><?= $e($card['label']) ?></span>
                <span class="alo-kpi__value"><?= $e($card['value']) ?></span>
            </article>
        <?php endforeach; ?>
    </div>

    <div class="alo-grid alo-grid--2 alo-dashboard-cols">
        <section class="card">
            <header class="alo-card__head">
                <h2>Recent results</h2>
                <a class="btn btn-link" href="/student/results">View all &rarr;</a>
            </header>
            <div class="alo-table-wrap">
                <table class="alo-table alo-table--compact">
                    <thead>
                        <tr><th>Set</th><th>Exam</th><th>Score</th><th>Date</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        <?php foreach ($recent as $row): ?>
                            <tr>
                                <td class="alo-mono"><?= $e($row['set']) ?></td>
                                <td><?= $e($row['exam']) ?></td>
                                <td class="alo-num"><?= $e($row['score']) ?></td>
                                <td><?= $e($row['date']) ?></td>
                                <td><span class="alo-badge alo-badge--info"><?= $e($row['status']) ?></span></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </section>

        <section class="card">
            <header class="alo-card__head"><h2>Profile strength</h2></header>
            <p>Your profile strength is based on test history, profile completeness, and engagement.</p>
            <div class="alo-progress" role="progressbar" aria-valuenow="<?= $e((string)$profileStrength) ?>" aria-valuemin="0" aria-valuemax="100">
                <div class="alo-progress__bar" style="width: <?= $e((string)$profileStrength) ?>%;"></div>
            </div>
            <p class="alo-progress__num"><?= $e((string)$profileStrength) ?>%</p>

            <h3>AI next action</h3>
            <p class="alo-ai-tip"><?= $e($aiNextAction) ?></p>
        </section>
    </div>

    <section class="card">
        <header class="alo-card__head">
            <h2>Upcoming appointments</h2>
            <a class="btn btn-link" href="/student/book-assessment">Book new &rarr;</a>
        </header>
        <ul class="alo-list alo-list--cards">
            <?php if (!empty($appointments)): ?>
                <?php foreach ($appointments as $appt): ?>
                    <li>
                        <strong><?= $e($appt['title']) ?></strong>
                        <span class="alo-list__meta"><?= $e($appt['when']) ?> · <?= $e($appt['with']) ?></span>
                    </li>
                <?php endforeach; ?>
            <?php else: ?>
                <li>No upcoming appointments. Book a speaking review session to get human feedback on your speaking practice.</li>
            <?php endif; ?>
        </ul>
    </section>

    <div class="alo-disclaimer-banner" role="note">
        <strong>Practice only.</strong>
        Scores shown on this dashboard are estimates produced by the ALO
        ScoringService and are not official exam results.
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
