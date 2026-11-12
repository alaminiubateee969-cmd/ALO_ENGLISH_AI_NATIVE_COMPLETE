<?php
/**
 * views/admin/agent-logs.php — Operational logs for AI agents.
 * Expected vars: $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Agent logs';
require __DIR__ . '/../layouts/header.php';
$logs = [
    ['time' => '2025-01-15 14:02:11', 'agent' => 'AGENT-QGEN-01',   'level' => 'INFO',  'message' => 'Generated 20 draft questions for IELTS-A'],
    ['time' => '2025-01-15 13:58:44', 'agent' => 'AGENT-REVIEW-01', 'level' => 'INFO',  'message' => 'Reviewed 20 drafts, approved 18, flagged 2'],
    ['time' => '2025-01-15 13:45:09', 'agent' => 'AGENT-WRITE-01',  'level' => 'INFO',  'message' => 'Evaluated ATT-2025-00482 writing (confidence 0.88)'],
    ['time' => '2025-01-15 13:45:08', 'agent' => 'AGENT-SPEAK-01',  'level' => 'INFO',  'message' => 'Evaluated ATT-2025-00482 speaking (confidence 0.86)'],
    ['time' => '2025-01-15 13:45:07', 'agent' => 'AGENT-CONDUCT-01','level' => 'INFO',  'message' => 'Submitted attempt ATT-2025-00482, auto-generated report'],
    ['time' => '2025-01-15 13:30:00', 'agent' => 'AGENT-CRM-01',    'level' => 'WARN',  'message' => 'CRM sync timeout for SYNC-5008, will retry in 4h'],
    ['time' => '2025-01-15 11:08:22', 'agent' => 'AGENT-WRITE-01',  'level' => 'WARN',  'message' => 'Low confidence (0.41) for ATT-2025-00470, review recommended'],
    ['time' => '2025-01-15 09:18:03', 'agent' => 'AGENT-GOV-01',    'level' => 'INFO',  'message' => 'Requested approval for permanent improvement: Writing rubric v2.3'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Agent operational logs</h1>
        <input class="form-input alo-search" type="search" placeholder="Filter by agent, level, or message…">
    </header>

    <div class="alo-table-wrap">
        <table class="alo-table alo-table--compact">
            <thead><tr><th>Time</th><th>Agent</th><th>Level</th><th>Message</th></tr></thead>
            <tbody>
                <?php foreach ($logs as $l): ?>
                    <tr>
                        <td class="alo-mono"><?= $e($l['time']) ?></td>
                        <td class="alo-mono"><?= $e($l['agent']) ?></td>
                        <td>
                            <?php $cls = ['INFO'=>'info','WARN'=>'warn','ERROR'=>'danger'][$l['level']] ?? 'info'; ?>
                            <span class="alo-badge alo-badge--<?= $cls ?>"><?= $e($l['level']) ?></span>
                        </td>
                        <td><?= $e($l['message']) ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <p class="alo-muted">Logs are append-only and retained for 90 days. Audit-grade events are mirrored to the audit log.</p>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
