<?php
/**
 * views/admin/mock-tests.php — Manage practice sets.
 * Expected vars: $sets (array), $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Practice sets';
require __DIR__ . '/../layouts/header.php';
$sets = isset($sets) && is_array($sets) ? $sets : [
    ['id' => 'IELTS-A-SET-007', 'exam' => 'IELTS-A', 'title' => 'IELTS Academic — Full Mock 7', 'questions' => 60, 'duration_min' => 165, 'status' => 'published'],
    ['id' => 'PTE-A-SET-003',   'exam' => 'PTE-A',   'title' => 'PTE Academic — Core Skills 3', 'questions' => 52, 'duration_min' => 120, 'status' => 'published'],
    ['id' => 'TOEFL-SET-011',   'exam' => 'TOEFL-iBT','title' => 'TOEFL iBT — Reading Focus 11','questions' => 42, 'duration_min' => 60,  'status' => 'published'],
    ['id' => 'SAT-SET-005',     'exam' => 'SAT',     'title' => 'SAT — Reading 5',              'questions' => 52, 'duration_min' => 65,  'status' => 'draft'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Practice sets (320 total)</h1>
        <p><a class="btn btn-primary" href="#">+ New practice set</a></p>
    </header>
    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>ID</th><th>Exam</th><th>Title</th><th>Questions</th><th>Duration</th><th>Status</th></tr></thead>
            <tbody>
                <?php foreach ($sets as $s): ?>
                    <tr>
                        <td class="alo-mono"><?= $e($s['id']) ?></td>
                        <td><span class="alo-badge alo-badge--info"><?= $e($s['exam']) ?></span></td>
                        <td><?= $e($s['title']) ?></td>
                        <td><?= $e((string)$s['questions']) ?></td>
                        <td><?= $e((string)$s['duration_min']) ?> min</td>
                        <td>
                            <?php $cls = $s['status'] === 'published' ? 'success' : 'warn'; ?>
                            <span class="alo-badge alo-badge--<?= $cls ?>"><?= $e($s['status']) ?></span>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
