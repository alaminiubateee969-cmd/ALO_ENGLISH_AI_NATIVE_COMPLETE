<?php
/**
 * views/admin/audit-logs.php — Security audit log.
 * Expected vars: $logs (array), $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Audit logs';
require __DIR__ . '/../layouts/header.php';
$logs = isset($logs) && is_array($logs) ? $logs : [
    ['time' => '2025-01-15 14:02:11', 'actor' => 'admin@alo',     'action' => 'QUESTION_PUBLISH', 'target' => 'Q-2003',           'ip' => '103.231.239.79'],
    ['time' => '2025-01-15 13:48:34', 'actor' => 'examiner@alo',  'action' => 'REVIEW_SUBMIT',    'target' => 'W-4815',           'ip' => '103.231.239.79'],
    ['time' => '2025-01-15 13:30:00', 'actor' => 'system',        'action' => 'WEEKLY_UPDATE_RUN','target' => 'pipeline',         'ip' => '127.0.0.1'],
    ['time' => '2025-01-15 12:55:22', 'actor' => 'admin@alo',     'action' => 'VOUCHER_ISSUE',    'target' => 'AMB-2025-0042-V01','ip' => '103.231.239.79'],
    ['time' => '2025-01-15 11:18:09', 'actor' => 'rifat@example.com','action' => 'LOGIN_SUCCESS', 'target' => 'session',          'ip' => '182.163.42.10'],
    ['time' => '2025-01-15 11:15:41', 'actor' => 'unknown',       'action' => 'LOGIN_FAILED',     'target' => 'admin@alo',        'ip' => '45.227.18.99'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Audit logs</h1>
        <input class="form-input alo-search" type="search" placeholder="Filter by actor, action, or IP…">
    </header>
    <div class="alo-table-wrap">
        <table class="alo-table alo-table--compact">
            <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th><th>IP</th></tr></thead>
            <tbody>
                <?php foreach ($logs as $l): ?>
                    <tr>
                        <td class="alo-mono"><?= $e($l['time']) ?></td>
                        <td><?= $e($l['actor']) ?></td>
                        <td>
                            <?php $cls = str_contains($l['action'], 'FAILED') ? 'danger' : (str_contains($l['action'], 'SUCCESS') ? 'success' : 'info'); ?>
                            <span class="alo-badge alo-badge--<?= $cls ?>"><?= $e($l['action']) ?></span>
                        </td>
                        <td class="alo-mono"><?= $e($l['target']) ?></td>
                        <td class="alo-mono"><?= $e($l['ip']) ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <p class="alo-muted">Audit logs are immutable and retained for 365 days.</p>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
