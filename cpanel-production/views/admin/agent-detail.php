<?php
/**
 * views/admin/agent-detail.php — Single AI agent detail + task history.
 * Expected vars: $user, $agent (array). PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Agent detail';
require __DIR__ . '/../layouts/header.php';
$agent = isset($agent) && is_array($agent) ? $agent : [
    'code' => 'AGENT-WRITE-01', 'name' => 'Writing Evaluator', 'dept' => 'Evaluation',
    'active' => true, 'auto' => true, 'exam_scope' => '["ALL"]',
    'responsibility' => 'Evaluates writing submissions across all 32 CBT exams using the local rule engine. Returns task achievement, coherence, vocabulary, grammar, word count, and improvement tips.',
    'public_label' => 'ALO Writing Evaluation', 'internal_label' => 'Writing Evaluation Service',
];
$tasks = [
    ['id' => 'TASK-91042', 'attempt' => 'ATT-2025-00482', 'status' => 'completed', 'confidence' => '0.88', 'provider' => 'local_rule_engine', 'completed_at' => '2025-01-15 13:45'],
    ['id' => 'TASK-91040', 'attempt' => 'ATT-2025-00479', 'status' => 'completed', 'confidence' => '0.82', 'provider' => 'local_rule_engine', 'completed_at' => '2025-01-15 12:22'],
    ['id' => 'TASK-91038', 'attempt' => 'ATT-2025-00470', 'status' => 'completed', 'confidence' => '0.41', 'provider' => 'local_rule_engine', 'completed_at' => '2025-01-15 11:08'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1><?= $e($agent['name']) ?></h1>
        <p>
            <span class="alo-badge alo-badge--info"><?= $e($agent['code']) ?></span>
            <span class="alo-badge alo-badge--info"><?= $e($agent['dept']) ?></span>
            <?= $agent['active'] ? '<span class="alo-badge alo-badge--success">active</span>' : '' ?>
            <?= $agent['auto'] ? '<span class="alo-badge alo-badge--warn">auto-execute</span>' : '<span class="alo-badge alo-badge--info">manual</span>' ?>
        </p>
    </header>

    <div class="alo-grid alo-grid--2">
        <section class="card">
            <header class="alo-card__head"><h2>Responsibility</h2></header>
            <p><?= $e($agent['responsibility']) ?></p>
            <ul class="alo-list">
                <li>Exam scope: <code class="alo-mono"><?= $e($agent['exam_scope']) ?></code></li>
                <li>Public label: <strong><?= $e($agent['public_label']) ?></strong></li>
                <li>Internal label: <span class="alo-muted"><?= $e($agent['internal_label']) ?></span></li>
            </ul>
        </section>
        <section class="card">
            <header class="alo-card__head"><h2>Quick stats (7 days)</h2></header>
            <ul class="alo-list">
                <li>Tasks completed: <strong>184</strong></li>
                <li>Failed: <strong>0</strong></li>
                <li>Avg confidence: <strong>0.84</strong></li>
                <li>Low-confidence: <strong>3</strong> (review recommended)</li>
                <li>Fallback used: <strong>0</strong></li>
            </ul>
        </section>
    </div>

    <section class="card">
        <header class="alo-card__head"><h2>Recent tasks</h2></header>
        <div class="alo-table-wrap">
            <table class="alo-table alo-table--compact">
                <thead><tr><th>Task</th><th>Attempt</th><th>Status</th><th>Confidence</th><th>Provider</th><th>Completed</th></tr></thead>
                <tbody>
                    <?php foreach ($tasks as $t): ?>
                        <tr>
                            <td class="alo-mono"><?= $e($t['id']) ?></td>
                            <td class="alo-mono"><?= $e($t['attempt']) ?></td>
                            <td><span class="alo-badge alo-badge--success"><?= $e($t['status']) ?></span></td>
                            <td>
                                <?php $c = (float)$t['confidence']; $cls = $c >= 0.70 ? 'success' : ($c >= 0.45 ? 'warn' : 'danger'); ?>
                                <span class="alo-badge alo-badge--<?= $cls ?>"><?= $e($t['confidence']) ?></span>
                            </td>
                            <td class="alo-mono"><?= $e($t['provider']) ?></td>
                            <td class="alo-mono"><?= $e($t['completed_at']) ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </section>

    <p><a class="btn btn-link" href="/admin/agent-logs">&larr; Back to agents</a> · <a class="btn btn-link" href="/admin/agent-approvals">View approval queue</a></p>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
