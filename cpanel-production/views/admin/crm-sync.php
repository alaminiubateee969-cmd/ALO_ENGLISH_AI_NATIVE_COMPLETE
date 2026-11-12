<?php
/**
 * views/admin/crm-sync.php — CRM integration sync queue.
 * Expected vars: $pending (array), $failed (array), $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'CRM sync';
require __DIR__ . '/../layouts/header.php';
$pending = isset($pending) && is_array($pending) ? $pending : [
    ['id' => 'SYNC-5012', 'type' => 'push_result',   'payload' => 'ATT-2025-00482', 'queued' => '2025-01-15 13:42'],
    ['id' => 'SYNC-5011', 'type' => 'sync_student',  'payload' => 'U-1001',         'queued' => '2025-01-15 13:40'],
    ['id' => 'SYNC-5010', 'type' => 'push_voucher',  'payload' => 'AMB-2025-0042',  'queued' => '2025-01-15 13:38'],
];
$failed = isset($failed) && is_array($failed) ? $failed : [
    ['id' => 'SYNC-5008', 'type' => 'push_result', 'payload' => 'ATT-2025-00478', 'error' => 'Timeout', 'attempts' => 3],
];
?>
<section class="container alo-section">
    <header class="alo-section__head"><h1>CRM sync queue</h1></header>

    <section class="card">
        <header class="alo-card__head"><h2>Pending (<?= $e((string)count($pending)) ?>)</h2></header>
        <div class="alo-table-wrap">
            <table class="alo-table alo-table--compact">
                <thead><tr><th>ID</th><th>Type</th><th>Payload</th><th>Queued</th></tr></thead>
                <tbody>
                    <?php foreach ($pending as $p): ?>
                        <tr>
                            <td class="alo-mono"><?= $e($p['id']) ?></td>
                            <td class="alo-mono"><?= $e($p['type']) ?></td>
                            <td class="alo-mono"><?= $e($p['payload']) ?></td>
                            <td class="alo-mono"><?= $e($p['queued']) ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </section>

    <section class="card">
        <header class="alo-card__head"><h2>Failed (<?= $e((string)count($failed)) ?>)</h2></header>
        <div class="alo-table-wrap">
            <table class="alo-table alo-table--compact">
                <thead><tr><th>ID</th><th>Type</th><th>Payload</th><th>Error</th><th>Attempts</th></tr></thead>
                <tbody>
                    <?php foreach ($failed as $f): ?>
                        <tr>
                            <td class="alo-mono"><?= $e($f['id']) ?></td>
                            <td class="alo-mono"><?= $e($f['type']) ?></td>
                            <td class="alo-mono"><?= $e($f['payload']) ?></td>
                            <td><span class="alo-badge alo-badge--danger"><?= $e($f['error']) ?></span></td>
                            <td><?= $e((string)$f['attempts']) ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </section>
    <p class="alo-muted">Cron job <code>crm_sync.php</code> runs hourly. <code>retry_failed_sync.php</code> runs every 4 hours.</p>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
