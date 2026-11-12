<?php
/**
 * views/admin/exam-types.php — Manage exam types.
 * Expected vars: $exams (array), $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Exam types';
require __DIR__ . '/../layouts/header.php';
$exams = isset($exams) && is_array($exams) ? $exams : [
    ['code' => 'IELTS-A',   'name' => 'IELTS Academic',          'category' => 'English Proficiency', 'sets' => 24, 'status' => 'published'],
    ['code' => 'IELTS-G',   'name' => 'IELTS General Training',   'category' => 'English Proficiency', 'sets' => 12, 'status' => 'published'],
    ['code' => 'PTE-A',     'name' => 'PTE Academic',             'category' => 'English Proficiency', 'sets' => 18, 'status' => 'published'],
    ['code' => 'TOEFL-iBT', 'name' => 'TOEFL iBT',                'category' => 'English Proficiency', 'sets' => 15, 'status' => 'published'],
    ['code' => 'DUOLINGO',  'name' => 'Duolingo English Test',    'category' => 'English Proficiency', 'sets' => 10, 'status' => 'published'],
    ['code' => 'OET-Med',   'name' => 'OET (Medicine)',           'category' => 'Professional',        'sets' => 8,  'status' => 'published'],
    ['code' => 'SAT',       'name' => 'SAT',                      'category' => 'Academic',            'sets' => 12, 'status' => 'published'],
    ['code' => 'GRE',       'name' => 'GRE General',              'category' => 'Academic',            'sets' => 10, 'status' => 'published'],
    ['code' => 'GMAT',      'name' => 'GMAT',                     'category' => 'Academic',            'sets' => 8,  'status' => 'published'],
    ['code' => 'LSAT',      'name' => 'LSAT',                     'category' => 'Academic',            'sets' => 6,  'status' => 'published'],
    ['code' => 'MCAT',      'name' => 'MCAT',                     'category' => 'Academic',            'sets' => 4,  'status' => 'published'],
    ['code' => 'ACT',       'name' => 'ACT',                      'category' => 'Academic',            'sets' => 5,  'status' => 'published'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head"><h1>Exam types (32)</h1></header>
    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Practice sets</th><th>Status</th></tr></thead>
            <tbody>
                <?php foreach ($exams as $ex): ?>
                    <tr>
                        <td class="alo-mono"><a href="/<?= $e(strtolower($ex['code'])) ?>"><?= $e($ex['code']) ?></a></td>
                        <td><?= $e($ex['name']) ?></td>
                        <td><?= $e($ex['category']) ?></td>
                        <td><?= $e((string)$ex['sets']) ?></td>
                        <td><span class="alo-badge alo-badge--success"><?= $e($ex['status']) ?></span></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <p class="alo-muted">Showing 12 of 32 exam types. All practice sets are original, exam-aligned material.</p>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
