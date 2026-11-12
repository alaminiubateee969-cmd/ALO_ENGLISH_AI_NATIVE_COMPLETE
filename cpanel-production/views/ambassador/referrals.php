<?php
/**
 * views/ambassador/referrals.php — Ambassador referral list.
 *
 * Expected vars:
 *   - $rows (array) referrals
 *   - $ctx (array) ambassador context
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Your referrals';
require __DIR__ . '/../layouts/header.php';
$rows = isset($rows) && is_array($rows) ? $rows : [
    ['name' => 'Sadia Islam',  'email' => 'sadia@example.com',  'status' => 'joined',   'joined' => '2025-01-12', 'commission' => '$3.00'],
    ['name' => 'Imran Khan',   'email' => 'imran@example.com',  'status' => 'practicing','joined' => '2025-01-09', 'commission' => '$1.50'],
    ['name' => 'Rohit Das',    'email' => 'rohit@example.com',  'status' => 'converted', 'joined' => '2025-01-04', 'commission' => '$8.00'],
    ['name' => 'Mei Chen',     'email' => 'mei@example.com',    'status' => 'invited',   'joined' => '—',          'commission' => '—'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Your referrals</h1>
        <p><a class="btn btn-primary" href="/ambassador/create-referral">+ New referral</a></p>
    </header>

    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Joined</th><th>Commission</th></tr></thead>
            <tbody>
                <?php foreach ($rows as $row): ?>
                    <tr>
                        <td><?= $e($row['name']) ?></td>
                        <td class="alo-mono"><?= $e($row['email']) ?></td>
                        <td>
                            <?php $st = $row['status']; $cls = ['converted'=>'success','joined'=>'info','practicing'=>'warn','invited'=>'info'][$st] ?? 'info'; ?>
                            <span class="alo-badge alo-badge--<?= $cls ?>"><?= $e($st) ?></span>
                        </td>
                        <td class="alo-mono"><?= $e($row['joined']) ?></td>
                        <td><?= $e($row['commission']) ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
