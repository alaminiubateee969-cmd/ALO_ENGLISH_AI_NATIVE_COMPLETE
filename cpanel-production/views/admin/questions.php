<?php
/**
 * views/admin/questions.php — Question review queue.
 * Expected vars: $questions (array), $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Questions';
require __DIR__ . '/../layouts/header.php';
$questions = isset($questions) && is_array($questions) ? $questions : [
    ['id' => 'Q-2001', 'exam' => 'IELTS-A', 'type' => 'multiple_choice', 'difficulty' => 'Medium', 'status' => 'approved'],
    ['id' => 'Q-2002', 'exam' => 'IELTS-A', 'type' => 'true_false_not_given', 'difficulty' => 'Hard', 'status' => 'draft'],
    ['id' => 'Q-2003', 'exam' => 'PTE-A',   'type' => 'fill_blank', 'difficulty' => 'Easy', 'status' => 'published'],
    ['id' => 'Q-2004', 'exam' => 'TOEFL',   'type' => 'multiple_choice', 'difficulty' => 'Medium', 'status' => 'draft'],
    ['id' => 'Q-2005', 'exam' => 'SAT',     'type' => 'multiple_choice', 'difficulty' => 'Hard', 'status' => 'flagged'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head"><h1>Question review queue</h1></header>
    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>ID</th><th>Exam</th><th>Type</th><th>Difficulty</th><th>Status</th><th></th></tr></thead>
            <tbody>
                <?php foreach ($questions as $q): ?>
                    <tr>
                        <td class="alo-mono"><?= $e($q['id']) ?></td>
                        <td><span class="alo-badge alo-badge--info"><?= $e($q['exam']) ?></span></td>
                        <td class="alo-mono"><?= $e($q['type']) ?></td>
                        <td><?= $e($q['difficulty']) ?></td>
                        <td>
                            <?php $cls = ['approved'=>'success','published'=>'success','draft'=>'warn','flagged'=>'danger'][$q['status']] ?? 'info'; ?>
                            <span class="alo-badge alo-badge--<?= $cls ?>"><?= $e($q['status']) ?></span>
                        </td>
                        <td><a class="btn btn-link" href="#">Review &rarr;</a></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <p class="alo-muted">Drafts are never auto-published. Every question requires admin approval.</p>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
