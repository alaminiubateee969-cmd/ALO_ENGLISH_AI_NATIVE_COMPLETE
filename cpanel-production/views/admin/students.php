<?php
/**
 * views/admin/students.php — Manage students.
 * Expected vars: $students (array), $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Students';
require __DIR__ . '/../layouts/header.php';
$students = isset($students) && is_array($students) ? $students : [
    ['id' => 'U-1001', 'name' => 'Rifat Hossain', 'email' => 'rifat@example.com', 'role' => 'STUDENT', 'joined' => '2025-01-08', 'attempts' => 3, 'status' => 'active'],
    ['id' => 'U-1002', 'name' => 'Nadia Karim',   'email' => 'nadia@example.com', 'role' => 'STUDENT', 'joined' => '2025-01-09', 'attempts' => 5, 'status' => 'active'],
    ['id' => 'U-1003', 'name' => 'Arjun Mehta',   'email' => 'arjun@example.com', 'role' => 'STUDENT', 'joined' => '2025-01-10', 'attempts' => 1, 'status' => 'active'],
    ['id' => 'U-1004', 'name' => 'Mei Chen',      'email' => 'mei@example.com',   'role' => 'STUDENT', 'joined' => '2025-01-12', 'attempts' => 0, 'status' => 'invited'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Students</h1>
        <input class="form-input alo-search" type="search" placeholder="Search by name or email…" aria-label="Search students">
    </header>
    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Attempts</th><th>Status</th></tr></thead>
            <tbody>
                <?php foreach ($students as $s): ?>
                    <tr>
                        <td class="alo-mono"><?= $e($s['id']) ?></td>
                        <td><?= $e($s['name']) ?></td>
                        <td class="alo-mono"><?= $e($s['email']) ?></td>
                        <td><span class="alo-badge alo-badge--info"><?= $e($s['role']) ?></span></td>
                        <td class="alo-mono"><?= $e($s['joined']) ?></td>
                        <td><?= $e((string)$s['attempts']) ?></td>
                        <td><span class="alo-badge alo-badge--success"><?= $e($s['status']) ?></span></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
