<?php
/**
 * views/admin/question-bank.php — Question bank browser by exam.
 * Expected vars: $types (array), $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Question bank';
require __DIR__ . '/../layouts/header.php';
$types = isset($types) && is_array($types) ? $types : [
    ['code' => 'IELTS-A', 'total' => 480, 'published' => 420, 'draft' => 40, 'flagged' => 5],
    ['code' => 'PTE-A',   'total' => 360, 'published' => 300, 'draft' => 50, 'flagged' => 3],
    ['code' => 'TOEFL',   'total' => 280, 'published' => 250, 'draft' => 25, 'flagged' => 2],
    ['code' => 'DUOLINGO','total' => 180, 'published' => 160, 'draft' => 18, 'flagged' => 1],
    ['code' => 'SAT',     'total' => 240, 'published' => 210, 'draft' => 28, 'flagged' => 0],
];
?>
<section class="container alo-section">
    <header class="alo-section__head"><h1>Question bank</h1></header>
    <div class="alo-grid alo-grid--3">
        <?php foreach ($types as $t): ?>
            <article class="card">
                <header class="alo-card__head">
                    <span class="alo-badge alo-badge--info"><?= $e($t['code']) ?></span>
                    <h2><?= $e((string)$t['total']) ?> questions</h2>
                </header>
                <ul class="alo-list">
                    <li>Published: <strong><?= $e((string)$t['published']) ?></strong></li>
                    <li>Draft: <strong><?= $e((string)$t['draft']) ?></strong></li>
                    <li>Flagged: <strong><?= $e((string)$t['flagged']) ?></strong></li>
                </ul>
                <p><a class="btn btn-link" href="/admin/questions?exam=<?= $e($t['code']) ?>">Browse &rarr;</a></p>
            </article>
        <?php endforeach; ?>
    </div>
    <div class="alo-disclaimer-banner" role="note">
        <strong>Practice only.</strong> All questions are original, written by the ALO academic team.
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
