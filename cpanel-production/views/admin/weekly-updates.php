<?php
/**
 * views/admin/weekly-updates.php — Weekly question update log.
 * Expected vars: $rows (array), $cfg (array), $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Weekly updates';
require __DIR__ . '/../layouts/header.php';
$rows = isset($rows) && is_array($rows) ? $rows : [
    ['id' => 'WU-2025-W03', 'week' => '2025-W03', 'generated' => 20, 'approved' => 18, 'published' => 18, 'status' => 'completed', 'ran_at' => '2025-01-19 02:00'],
    ['id' => 'WU-2025-W02', 'week' => '2025-W02', 'generated' => 20, 'approved' => 20, 'published' => 20, 'status' => 'completed', 'ran_at' => '2025-01-12 02:00'],
    ['id' => 'WU-2025-W01', 'week' => '2025-W01', 'generated' => 20, 'approved' => 15, 'published' => 15, 'status' => 'completed', 'ran_at' => '2025-01-05 02:00'],
];
$cfg = isset($cfg) && is_array($cfg) ? $cfg : ['enabled' => true, 'day' => 'Sunday', 'time' => '02:00', 'target' => 20, 'auto_publish' => false, 'reviewer_required' => true];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Weekly question updates</h1>
        <form method="post" action="/admin/weekly-updates/run">
            <input type="hidden" name="csrf_token" value="<?= $e(isset($csrf_token) ? $csrf_token : '') ?>">
            <button class="btn btn-primary" type="submit">Run weekly update now</button>
        </form>
    </header>

    <section class="card">
        <header class="alo-card__head"><h2>Configuration</h2></header>
        <ul class="alo-list">
            <li>Enabled: <strong><?= !empty($cfg['enabled']) ? 'Yes' : 'No' ?></strong></li>
            <li>Schedule: <strong><?= $e((string)($cfg['day'] ?? 'Sunday')) ?> <?= $e((string)($cfg['time'] ?? '02:00')) ?></strong></li>
            <li>Questions per run: <strong><?= $e((string)($cfg['target'] ?? 20)) ?></strong></li>
            <li>Auto-publish: <strong><?= !empty($cfg['auto_publish']) ? 'Yes (DANGER)' : 'No (drafts require approval)' ?></strong></li>
            <li>Reviewer required: <strong><?= !empty($cfg['reviewer_required']) ? 'Yes' : 'No' ?></strong></li>
        </ul>
    </section>

    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>ID</th><th>Week</th><th>Generated</th><th>Approved</th><th>Published</th><th>Status</th><th>Ran at</th></tr></thead>
            <tbody>
                <?php foreach ($rows as $r): ?>
                    <tr>
                        <td class="alo-mono"><?= $e($r['id']) ?></td>
                        <td class="alo-mono"><?= $e($r['week']) ?></td>
                        <td><?= $e((string)$r['generated']) ?></td>
                        <td><?= $e((string)$r['approved']) ?></td>
                        <td><?= $e((string)$r['published']) ?></td>
                        <td><span class="alo-badge alo-badge--success"><?= $e($r['status']) ?></span></td>
                        <td class="alo-mono"><?= $e($r['ran_at']) ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <p class="alo-muted">Drafts are <strong>never</strong> auto-published. Every question requires admin approval.</p>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
