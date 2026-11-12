<?php
/**
 * views/admin/agent-approvals.php — Admin approval queue for high-risk agent actions.
 * Expected vars: $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Agent approvals';
require __DIR__ . '/../layouts/header.php';
$queue = [
    ['id' => 'APR-204', 'agent' => 'AGENT-QGEN-01',  'action' => 'publish_question',   'target' => 'Q-2003 (IELTS-A Reading)', 'requested_by' => 'system',  'requested_at' => '2025-01-15 14:02', 'status' => 'pending'],
    ['id' => 'APR-203', 'agent' => 'AGENT-SEO-01',   'action' => 'publish_seo_page',   'target' => 'ielts-band-7-guide',        'requested_by' => 'system',  'requested_at' => '2025-01-15 11:30', 'status' => 'pending'],
    ['id' => 'APR-202', 'agent' => 'AGENT-GOV-01',   'action' => 'permanent_improvement','target' => 'Writing rubric v2.3',      'requested_by' => 'system',  'requested_at' => '2025-01-15 09:18', 'status' => 'pending'],
    ['id' => 'APR-201', 'agent' => 'AGENT-TRAIN-01', 'action' => 'update_knowledge_base','target' => 'KB-IELTS-2025',            'requested_by' => 'admin@alo','requested_at' => '2025-01-14 16:45','status' => 'approved'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Agent approval queue</h1>
        <p>High-risk agent actions require admin approval before execution.</p>
    </header>

    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>ID</th><th>Agent</th><th>Action</th><th>Target</th><th>Requested by</th><th>When</th><th>Status</th><th></th></tr></thead>
            <tbody>
                <?php foreach ($queue as $q): ?>
                    <tr>
                        <td class="alo-mono"><?= $e($q['id']) ?></td>
                        <td class="alo-mono"><?= $e($q['agent']) ?></td>
                        <td><span class="alo-badge alo-badge--warn"><?= $e($q['action']) ?></span></td>
                        <td class="alo-mono"><?= $e($q['target']) ?></td>
                        <td><?= $e($q['requested_by']) ?></td>
                        <td class="alo-mono"><?= $e($q['requested_at']) ?></td>
                        <td>
                            <?php $cls = $q['status'] === 'approved' ? 'success' : 'warn'; ?>
                            <span class="alo-badge alo-badge--<?= $cls ?>"><?= $e($q['status']) ?></span>
                        </td>
                        <td>
                            <?php if ($q['status'] === 'pending'): ?>
                                <button class="btn btn-secondary alo-btn--sm" type="button">Approve</button>
                                <button class="btn btn-danger alo-btn--sm" type="button">Reject</button>
                            <?php else: ?>
                                <span class="alo-muted">—</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <p class="alo-muted">Approved actions are logged immutably in the audit trail. Rejected actions are discarded.</p>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
