<?php
/**
 * views/admin/agents.php — AI Agent Employee workforce.
 * Expected vars: $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'AI Agent Employees';
require __DIR__ . '/../layouts/header.php';
$agents = [
    ['code' => 'AGENT-QGEN-01', 'name' => 'Question Generator',          'dept' => 'Academic',       'active' => true,  'auto' => false],
    ['code' => 'AGENT-REVIEW-01','name' => 'Question Reviewer',           'dept' => 'Academic',       'active' => true,  'auto' => false],
    ['code' => 'AGENT-QUAL-01',  'name' => 'Quality Auditor',             'dept' => 'Academic',       'active' => true,  'auto' => false],
    ['code' => 'AGENT-WRITE-01', 'name' => 'Writing Evaluator',           'dept' => 'Evaluation',     'active' => true,  'auto' => true],
    ['code' => 'AGENT-SPEAK-01', 'name' => 'Speaking Evaluator',          'dept' => 'Evaluation',     'active' => true,  'auto' => true],
    ['code' => 'AGENT-INTERVIEW-01','name' => 'Interview Simulator',      'dept' => 'Evaluation',     'active' => true,  'auto' => true],
    ['code' => 'AGENT-CONDUCT-01','name' => 'Exam Conductor',             'dept' => 'Operations',     'active' => true,  'auto' => true],
    ['code' => 'AGENT-REPORT-01','name' => 'Smart Report Generator',      'dept' => 'Operations',     'active' => true,  'auto' => true],
    ['code' => 'AGENT-CERT-01', 'name' => 'Certificate Agent',            'dept' => 'Operations',     'active' => true,  'auto' => true],
    ['code' => 'AGENT-QUOTA-01','name' => 'Quota Enforcer',               'dept' => 'Operations',     'active' => true,  'auto' => true],
    ['code' => 'AGENT-PROCTOR-01','name' => 'Digital Proctor',            'dept' => 'Operations',     'active' => true,  'auto' => true],
    ['code' => 'AGENT-CRM-01',  'name' => 'CRM Sync Agent',               'dept' => 'Integration',    'active' => true,  'auto' => true],
    ['code' => 'AGENT-INVOICE-01','name' => 'Invoice Agent',              'dept' => 'Finance',        'active' => true,  'auto' => true],
    ['code' => 'AGENT-SEO-01',  'name' => 'SEO Content Agent',            'dept' => 'Marketing',      'active' => true,  'auto' => false],
    ['code' => 'AGENT-LEAD-01', 'name' => 'Lead Capture Agent',           'dept' => 'Marketing',      'active' => true,  'auto' => true],
    ['code' => 'AGENT-AUDIT-01','name' => 'Audit Logger',                 'dept' => 'Compliance',     'active' => true,  'auto' => true],
    ['code' => 'AGENT-GOV-01',  'name' => 'Governance Overseer',          'dept' => 'Compliance',     'active' => true,  'auto' => false],
    ['code' => 'AGENT-TRAIN-01','name' => 'Training Coordinator',         'dept' => 'Academic',       'active' => true,  'auto' => false],
    ['code' => 'AGENT-FEEDBACK-01','name' => 'Feedback Analyzer',         'dept' => 'Academic',       'active' => true,  'auto' => true],
    ['code' => 'AGENT-AMB-01',  'name' => 'Ambassador Coordinator',       'dept' => 'Operations',     'active' => true,  'auto' => true],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>AI Agent Employees</h1>
        <p>20 agents across 6 departments. <a class="btn btn-link" href="/admin/exam-conduct">No-Human Mode dashboard &rarr;</a></p>
    </header>

    <div class="alo-badge alo-badge--info" role="note" style="display:block;padding:.75rem 1rem;margin-bottom:1rem;">
        Agents are <strong>employees of ALO</strong>, not third-party bots. High-risk actions (question publishing, permanent improvements) require admin approval.
        Auto-executing agents operate within strictly-scoped, reversible boundaries.
    </div>

    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>Code</th><th>Name</th><th>Department</th><th>Active</th><th>Auto-execute</th><th></th></tr></thead>
            <tbody>
                <?php foreach ($agents as $a): ?>
                    <tr>
                        <td class="alo-mono"><?= $e($a['code']) ?></td>
                        <td><?= $e($a['name']) ?></td>
                        <td><span class="alo-badge alo-badge--info"><?= $e($a['dept']) ?></span></td>
                        <td><?= $a['active'] ? '<span class="alo-badge alo-badge--success">active</span>' : '<span class="alo-badge alo-badge--danger">off</span>' ?></td>
                        <td><?= $a['auto'] ? '<span class="alo-badge alo-badge--warn">auto</span>' : '<span class="alo-badge alo-badge--info">manual</span>' ?></td>
                        <td><a class="btn btn-link" href="/admin/agents/<?= $e($a['code']) ?>">Details &rarr;</a></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
