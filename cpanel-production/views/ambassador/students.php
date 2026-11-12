<?php
/**
 * views/ambassador/students.php — Referred students.
 *
 * Expected vars: $rows (array), $ctx (array)
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Referred students';
require __DIR__ . '/../layouts/header.php';
$rows = isset($rows) && is_array($rows) ? $rows : [
    ['name' => 'Sadia Islam', 'email' => 'sadia@example.com', 'exams_taken' => 3, 'last_active' => '2025-01-15', 'status' => 'active'],
    ['name' => 'Imran Khan',  'email' => 'imran@example.com', 'exams_taken' => 1, 'last_active' => '2025-01-14', 'status' => 'active'],
    ['name' => 'Rohit Das',   'email' => 'rohit@example.com', 'exams_taken' => 7, 'last_active' => '2025-01-15', 'status' => 'converted'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head"><h1>Referred students</h1></header>
    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>Name</th><th>Email</th><th>Exams</th><th>Last active</th><th>Status</th></tr></thead>
            <tbody>
                <?php foreach ($rows as $row): ?>
                    <tr>
                        <td><?= $e($row['name']) ?></td>
                        <td class="alo-mono"><?= $e($row['email']) ?></td>
                        <td><?= $e((string)$row['exams_taken']) ?></td>
                        <td class="alo-mono"><?= $e($row['last_active']) ?></td>
                        <td><span class="alo-badge alo-badge--success"><?= $e($row['status']) ?></span></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
