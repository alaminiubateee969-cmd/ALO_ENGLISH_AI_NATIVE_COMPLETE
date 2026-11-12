<?php
/**
 * views/examiner/speaking-queue.php — Speaking session review queue.
 *
 * Expected vars:
 *   - $rows (array) speaking sessions
 *   - $user (array) current examiner
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Speaking review queue';
require __DIR__ . '/../layouts/header.php';
$rows = isset($rows) && is_array($rows) ? $rows : [
    ['id' => 'S-3912', 'student' => 'Rifat Hossain', 'exam' => 'IELTS-A',  'set' => 'IELTS-A-SET-007', 'duration_sec' => 742, 'parts' => 3, 'submitted' => '2025-01-15 13:50'],
    ['id' => 'S-3910', 'student' => 'Nadia Karim',   'exam' => 'OET-Med',  'set' => 'OET-SET-005',    'duration_sec' => 689, 'parts' => 2, 'submitted' => '2025-01-15 12:30'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Speaking review queue</h1>
        <p>Recorded speaking sessions awaiting review. <span class="alo-demo-tag">Demo data</span></p>
    </header>

    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead>
                <tr><th>ID</th><th>Student</th><th>Exam</th><th>Set</th><th>Duration</th><th>Parts</th><th>Submitted</th><th></th></tr>
            </thead>
            <tbody>
                <?php foreach ($rows as $row): ?>
                    <tr>
                        <td class="alo-mono"><?= $e($row['id']) ?></td>
                        <td><?= $e($row['student']) ?></td>
                        <td><span class="alo-badge alo-badge--info"><?= $e($row['exam']) ?></span></td>
                        <td class="alo-mono"><?= $e($row['set']) ?></td>
                        <td class="alo-mono"><?= $e(gmdate('i:s', (int)$row['duration_sec'])) ?></td>
                        <td><?= $e((string)$row['parts']) ?></td>
                        <td class="alo-mono"><?= $e($row['submitted']) ?></td>
                        <td><a class="btn btn-link" href="/examiner/reviews">Review &rarr;</a></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <div class="alo-disclaimer-banner" role="note">
        <strong>Practice only.</strong> All speaking prompts are original practice material — not official exam content.
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
