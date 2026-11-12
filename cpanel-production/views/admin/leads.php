<?php
/**
 * views/admin/leads.php — Lead management.
 * Expected vars: $leads (array), $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Leads';
require __DIR__ . '/../layouts/header.php';
$leads = isset($leads) && is_array($leads) ? $leads : [
    ['name' => 'Sadia Islam', 'email' => 'sadia@example.com', 'source' => 'Website form', 'exam' => 'IELTS-A', 'status' => 'new',       'date' => '2025-01-15'],
    ['name' => 'Imran Khan',  'email' => 'imran@example.com', 'source' => 'Ambassador',   'exam' => 'PTE-A',   'status' => 'contacted', 'date' => '2025-01-14'],
    ['name' => 'Rohit Das',   'email' => 'rohit@example.com', 'source' => 'Facebook ad',  'exam' => 'TOEFL',   'status' => 'converted', 'date' => '2025-01-13'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head"><h1>Leads</h1></header>
    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>Name</th><th>Email</th><th>Source</th><th>Exam interest</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
                <?php foreach ($leads as $l): ?>
                    <tr>
                        <td><?= $e($l['name']) ?></td>
                        <td class="alo-mono"><?= $e($l['email']) ?></td>
                        <td><?= $e($l['source']) ?></td>
                        <td><span class="alo-badge alo-badge--info"><?= $e($l['exam']) ?></span></td>
                        <td>
                            <?php $cls = ['new'=>'info','contacted'=>'warn','converted'=>'success'][$l['status']] ?? 'info'; ?>
                            <span class="alo-badge alo-badge--<?= $cls ?>"><?= $e($l['status']) ?></span>
                        </td>
                        <td class="alo-mono"><?= $e($l['date']) ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
