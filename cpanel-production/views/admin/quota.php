<?php
/**
 * views/admin/quota.php — Free quota settings.
 * Expected vars: $rows (array), $alo_limit, $public_limit, $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Free quota';
require __DIR__ . '/../layouts/header.php';
$aloLimit = isset($alo_limit) ? $alo_limit : 3;
$pubLimit = isset($public_limit) ? $public_limit : 1;
$rows = isset($rows) && is_array($rows) ? $rows : [
    ['student_type' => 'ALO student',           'free_quota' => $aloLimit, 'enforced' => 'backend', 'note' => 'Students enrolled in ALO courses'],
    ['student_type' => 'Public student',        'free_quota' => $pubLimit, 'enforced' => 'backend', 'note' => 'Anyone who registers directly'],
    ['student_type' => 'Partner student',       'free_quota' => 2,         'enforced' => 'backend', 'note' => 'Via partner schools'],
    ['student_type' => 'Ambassador-referred',   'free_quota' => 2,         'enforced' => 'backend', 'note' => 'Referred by an ambassador'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head"><h1>Free quota settings</h1></header>
    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>Student type</th><th>Free attempts</th><th>Enforced</th><th>Note</th></tr></thead>
            <tbody>
                <?php foreach ($rows as $r): ?>
                    <tr>
                        <td><?= $e($r['student_type']) ?></td>
                        <td><strong><?= $e((string)$r['free_quota']) ?></strong></td>
                        <td><span class="alo-badge alo-badge--success"><?= $e($r['enforced']) ?></span></td>
                        <td><?= $e($r['note']) ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <form class="card alo-form" method="post" action="/admin/settings">
        <input type="hidden" name="csrf_token" value="<?= $e(isset($csrf_token) ? $csrf_token : '') ?>">
        <input type="hidden" name="action" value="update_quota">
        <div class="form-row">
            <label class="form-label" for="alo">ALO student free quota</label>
            <input class="form-input" type="number" id="alo" name="free_quota_alo" value="<?= $e((string)$aloLimit) ?>" min="0" max="20">
        </div>
        <div class="form-row">
            <label class="form-label" for="pub">Public student free quota</label>
            <input class="form-input" type="number" id="pub" name="free_quota_public" value="<?= $e((string)$pubLimit) ?>" min="0" max="20">
        </div>
        <div class="form-row"><button class="btn btn-primary" type="submit">Save quota</button></div>
    </form>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
