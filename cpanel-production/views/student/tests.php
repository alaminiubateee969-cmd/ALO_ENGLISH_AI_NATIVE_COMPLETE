<?php
/**
 * views/student/tests.php — Available practice tests for the student.
 * Expected vars: $sets (array), $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Practice tests';
require __DIR__ . '/../layouts/header.php';
$sets = isset($sets) && is_array($sets) ? $sets : [
    ['id' => 'IELTS-A-SET-007', 'exam' => 'IELTS-A',  'title' => 'IELTS Academic — Full Mock 7',  'questions' => 60, 'duration_min' => 165, 'difficulty' => 'Mixed'],
    ['id' => 'PTE-A-SET-003',   'exam' => 'PTE-A',    'title' => 'PTE Academic — Core Skills 3',  'questions' => 52, 'duration_min' => 120, 'difficulty' => 'Medium'],
    ['id' => 'TOEFL-SET-011',   'exam' => 'TOEFL-iBT','title' => 'TOEFL iBT — Reading Focus 11',  'questions' => 42, 'duration_min' => 60,  'difficulty' => 'Hard'],
    ['id' => 'DUOLINGO-SET-002','exam' => 'DUOLINGO', 'title' => 'Duolingo — Adaptive Drill 2',   'questions' => 28, 'duration_min' => 45,  'difficulty' => 'Easy'],
    ['id' => 'SAT-SET-005',     'exam' => 'SAT',      'title' => 'SAT — Evidence-Based Reading 5','questions' => 52, 'duration_min' => 65,  'difficulty' => 'Medium'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Practice tests</h1>
        <p>Choose a set to begin. Your free quota is shown in the dashboard.</p>
    </header>
    <div class="alo-grid alo-grid--2">
        <?php foreach ($sets as $set): ?>
            <article class="card">
                <header class="alo-card__head">
                    <span class="alo-badge alo-badge--info"><?= $e($set['exam']) ?></span>
                    <h2><?= $e($set['title']) ?></h2>
                </header>
                <ul class="alo-list">
                    <li><?= $e((string)$set['questions']) ?> questions</li>
                    <li><?= $e((string)$set['duration_min']) ?> minutes</li>
                    <li>Difficulty: <?= $e($set['difficulty']) ?></li>
                </ul>
                <p><a class="btn btn-primary" href="/student/start-test/<?= $e($set['id']) ?>">Start &rarr;</a></p>
            </article>
        <?php endforeach; ?>
    </div>
    <div class="alo-disclaimer-banner" role="note">
        <strong>Practice only.</strong> All sets are original, exam-aligned practice material — not official exam content.
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
