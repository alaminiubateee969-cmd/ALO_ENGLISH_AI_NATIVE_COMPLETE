<?php
/**
 * views/admin/attempts.php — All student attempts.
 * Expected vars: $attempts (array), $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Attempts';
require __DIR__ . '/../layouts/header.php';
$attempts = isset($attempts) && is_array($attempts) ? $attempts : [
    ['id' => 'ATT-2025-00482', 'student' => 'Rifat Hossain', 'exam' => 'IELTS-A', 'set' => 'IELTS-A-SET-007', 'started' => '2025-01-15 13:40', 'status' => 'submitted', 'score' => '7.0'],
    ['id' => 'ATT-2025-00481', 'student' => 'Nadia Karim',   'exam' => 'PTE-A',   'set' => 'PTE-A-SET-003',   'started' => '2025-01-15 12:10', 'status' => 'in_progress', 'score' => '—'],
    ['id' => 'ATT-2025-00480', 'student' => 'Arjun Mehta',   'exam' => 'TOEFL-iBT','set' => 'TOEFL-SET-011',  'started' => '2025-01-15 10:30', 'status' => 'submitted', 'score' => '98'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head"><h1>All attempts</h1></header>
    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>Attempt</th><th>Student</th><th>Exam</th><th>Set</th><th>Started</th><th>Status</th><th>Score</th></tr></thead>
            <tbody>
                <?php foreach ($attempts as $a): ?>
                    <tr>
                        <td class="alo-mono"><?= $e($a['id']) ?></td>
                        <td><?= $e($a['student']) ?></td>
                        <td><span class="alo-badge alo-badge--info"><?= $e($a['exam']) ?></span></td>
                        <td class="alo-mono"><?= $e($a['set']) ?></td>
                        <td class="alo-mono"><?= $e($a['started']) ?></td>
                        <td>
                            <?php $cls = $a['status'] === 'submitted' ? 'success' : 'warn'; ?>
                            <span class="alo-badge alo-badge--<?= $cls ?>"><?= $e($a['status']) ?></span>
                        </td>
                        <td><strong><?= $e($a['score']) ?></strong></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
