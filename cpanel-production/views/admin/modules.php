<?php
/**
 * views/admin/modules.php — Exam modules (sections per exam).
 * Expected vars: $modules (array), $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Exam modules';
require __DIR__ . '/../layouts/header.php';
$modules = isset($modules) && is_array($modules) ? $modules : [
    ['exam' => 'IELTS-A', 'module' => 'Listening', 'questions' => 40, 'duration_min' => 30, 'type' => 'audio'],
    ['exam' => 'IELTS-A', 'module' => 'Reading',   'questions' => 40, 'duration_min' => 60, 'type' => 'text'],
    ['exam' => 'IELTS-A', 'module' => 'Writing',   'questions' => 2,  'duration_min' => 60, 'type' => 'essay'],
    ['exam' => 'IELTS-A', 'module' => 'Speaking',  'questions' => 3,  'duration_min' => 15, 'type' => 'audio_response'],
    ['exam' => 'PTE-A',   'module' => 'Speaking & Writing', 'questions' => 28, 'duration_min' => 77, 'type' => 'mixed'],
    ['exam' => 'PTE-A',   'module' => 'Reading',   'questions' => 13, 'duration_min' => 32, 'type' => 'text'],
    ['exam' => 'PTE-A',   'module' => 'Listening', 'questions' => 11, 'duration_min' => 43, 'type' => 'audio'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head"><h1>Exam modules</h1></header>
    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>Exam</th><th>Module</th><th>Questions</th><th>Duration</th><th>Type</th></tr></thead>
            <tbody>
                <?php foreach ($modules as $m): ?>
                    <tr>
                        <td><span class="alo-badge alo-badge--info"><?= $e($m['exam']) ?></span></td>
                        <td><?= $e($m['module']) ?></td>
                        <td><?= $e((string)$m['questions']) ?></td>
                        <td><?= $e((string)$m['duration_min']) ?> min</td>
                        <td class="alo-mono"><?= $e($m['type']) ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
