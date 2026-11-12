<?php
/**
 * views/student/study-plan.php — Personalised study plan.
 * Expected vars: $weaknesses (array), $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Study plan';
require __DIR__ . '/../layouts/header.php';
$weaknesses = isset($weaknesses) && is_array($weaknesses) ? $weaknesses : [
    ['area' => 'Writing — Task 2 coherence', 'score' => '6.0', 'priority' => 'High',   'recommended' => 'IELTS-A-SET-009, Writing focus drills'],
    ['area' => 'Speaking — Lexical resource', 'score' => '6.5', 'priority' => 'Medium', 'recommended' => 'Vocabulary builder, Speaking set 4'],
    ['area' => 'Reading — Skim/scan speed',  'score' => '7.0', 'priority' => 'Low',    'recommended' => 'Timed reading drills'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Your study plan</h1>
        <p>Based on your recent attempts. Focus on high-priority areas first.</p>
    </header>
    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>Area</th><th>Last score</th><th>Priority</th><th>Recommended practice</th></tr></thead>
            <tbody>
                <?php foreach ($weaknesses as $w): ?>
                    <tr>
                        <td><?= $e($w['area']) ?></td>
                        <td><?= $e($w['score']) ?></td>
                        <td>
                            <?php $cls = ['High'=>'danger','Medium'=>'warn','Low'=>'info'][$w['priority']] ?? 'info'; ?>
                            <span class="alo-badge alo-badge--<?= $cls ?>"><?= $e($w['priority']) ?></span>
                        </td>
                        <td><?= $e($w['recommended']) ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <p><a class="btn btn-primary" href="/student/tests">Browse practice tests &rarr;</a></p>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
