<?php
/**
 * views/student/results.php — Student results list.
 * Expected vars: $results (array), $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Your results';
require __DIR__ . '/../layouts/header.php';
$results = isset($results) && is_array($results) ? $results : [
    ['id' => 'ATT-2025-00482', 'exam' => 'IELTS-A',  'date' => '2025-01-15', 'score' => '7.0', 'band' => 'Good', 'status' => 'auto_generated'],
    ['id' => 'ATT-2025-00479', 'exam' => 'PTE-A',    'date' => '2025-01-12', 'score' => '73',  'band' => '—',    'status' => 'auto_generated'],
    ['id' => 'ATT-2025-00470', 'exam' => 'TOEFL-iBT','date' => '2025-01-08', 'score' => '98',  'band' => '—',    'status' => 'review_recommended'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head"><h1>Your results</h1></header>
    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>Attempt</th><th>Exam</th><th>Date</th><th>Score</th><th>Band</th><th>Report</th><th></th></tr></thead>
            <tbody>
                <?php foreach ($results as $r): ?>
                    <tr>
                        <td class="alo-mono"><?= $e($r['id']) ?></td>
                        <td><span class="alo-badge alo-badge--info"><?= $e($r['exam']) ?></span></td>
                        <td class="alo-mono"><?= $e($r['date']) ?></td>
                        <td><strong><?= $e($r['score']) ?></strong></td>
                        <td><?= $e($r['band']) ?></td>
                        <td>
                            <?php $cls = $r['status'] === 'review_recommended' ? 'warn' : 'success'; ?>
                            <span class="alo-badge alo-badge--<?= $cls ?>"><?= $e(str_replace('_',' ',$r['status'])) ?></span>
                        </td>
                        <td><a class="btn btn-link" href="/student/results/<?= $e($r['id']) ?>">View report &rarr;</a></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <div class="alo-disclaimer-banner" role="note">
        <strong>Practice only.</strong> Scores are practice indicators — not official exam scores.
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
