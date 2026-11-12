<?php
/**
 * views/examiner/writing-queue.php — Writing submission review queue.
 *
 * Expected vars:
 *   - $rows (array) writing submissions awaiting review
 *   - $user (array) current examiner
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Writing review queue';
require __DIR__ . '/../layouts/header.php';
$rows = isset($rows) && is_array($rows) ? $rows : [
    ['id' => 'W-4821', 'student' => 'Rifat Hossain', 'exam' => 'IELTS-A', 'set' => 'IELTS-A-SET-007', 'submitted' => '2025-01-15 13:42', 'word_count' => 268, 'prompt' => 'Task 2 — Some people believe that public funding should…'],
    ['id' => 'W-4820', 'student' => 'Nadia Karim',  'exam' => 'PTE-A',    'set' => 'PTE-A-SET-003',   'submitted' => '2025-01-15 12:18', 'word_count' => 241, 'prompt' => 'Write an essay (200–300 words) on the importance of…'],
    ['id' => 'W-4818', 'student' => 'Arjun Mehta',   'exam' => 'TOEFL-iBT','set' => 'TOEFL-SET-011',  'submitted' => '2025-01-15 10:55', 'word_count' => 312, 'prompt' => 'Independent writing — Do you agree or disagree…'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Writing review queue</h1>
        <p>Submissions awaiting human review. <span class="alo-demo-tag">Demo data</span></p>
    </header>

    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead>
                <tr><th>ID</th><th>Student</th><th>Exam</th><th>Set</th><th>Submitted</th><th>Words</th><th></th></tr>
            </thead>
            <tbody>
                <?php foreach ($rows as $row): ?>
                    <tr>
                        <td class="alo-mono"><?= $e($row['id']) ?></td>
                        <td><?= $e($row['student']) ?></td>
                        <td><span class="alo-badge alo-badge--info"><?= $e($row['exam']) ?></span></td>
                        <td class="alo-mono"><?= $e($row['set']) ?></td>
                        <td class="alo-mono"><?= $e($row['submitted']) ?></td>
                        <td><?= $e((string)$row['word_count']) ?></td>
                        <td><a class="btn btn-link" href="/examiner/reviews">Review &rarr;</a></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <div class="alo-disclaimer-banner" role="note">
        <strong>Practice only.</strong> All writing prompts and submissions are original practice material — not official exam content.
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
