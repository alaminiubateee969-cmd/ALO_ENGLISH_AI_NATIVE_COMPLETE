<?php
/**
 * views/admin/exam-conduct.php — Exam conductor dashboard (No-Human Mode).
 * Expected vars: $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Exam conductor';
require __DIR__ . '/../layouts/header.php';
$kpis = [
    ['label' => 'Automated attempts (30d)',  'value' => '1,284'],
    ['label' => 'Writing auto-evaluated',    'value' => '1,284'],
    ['label' => 'Speaking auto-evaluated',   'value' => '1,284'],
    ['label' => 'Interview simulated',       'value' => '96'],
    ['label' => 'Low-confidence',            'value' => '29'],
    ['label' => 'Optional review queue',     'value' => '4'],
    ['label' => 'Failed tasks',              'value' => '0'],
    ['label' => 'Fallback engine used',      'value' => '0'],
];
$dist = [
    ['level' => 'High (≥0.70)',   'count' => 1198, 'action' => 'Auto report generated', 'pct' => 93.3],
    ['level' => 'Medium (0.45–0.70)', 'count' => 57,  'action' => 'Auto report + optional review', 'pct' => 4.4],
    ['level' => 'Low (<0.45)',    'count' => 29,  'action' => 'Provisional report + review recommended', 'pct' => 2.3],
];
$providers = [
    ['name' => 'local_rule_engine',     'status' => 'active',   'note' => 'Default — no API key needed. Always works.'],
    ['name' => 'groq (Llama 3.3 70B)',  'status' => 'ready',    'note' => 'Fully wired. Set AI_ENABLED=true + GROQ_API_KEY to activate AI-refined scoring.'],
    ['name' => 'gemini / openrouter',   'status' => 'standby',  'note' => 'Recognised but not wired. Extend AiClient.php to use.'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Exam conductor</h1>
        <p><span class="alo-badge alo-badge--success">No-Human Practice Exam Mode: ENABLED</span></p>
    </header>

    <div class="alo-badge alo-badge--success" role="note" style="display:block;padding:.75rem 1rem;margin-bottom:1rem;">
        All 32 CBT exams run start → report without human staff. Evaluation is automated via the local rule engine.
        ALO Academic Team Review is <strong>optional</strong> and never blocks the student's report.
    </div>

    <div class="alo-grid alo-grid--4 alo-kpi">
        <?php foreach ($kpis as $kpi): ?>
            <article class="card alo-kpi__card">
                <span class="alo-kpi__label"><?= $e($kpi['label']) ?></span>
                <span class="alo-kpi__value"><?= $e($kpi['value']) ?></span>
            </article>
        <?php endforeach; ?>
    </div>

    <div class="alo-grid alo-grid--2">
        <section class="card">
            <header class="alo-card__head"><h2>Confidence distribution</h2></header>
            <div class="alo-table-wrap">
                <table class="alo-table alo-table--compact">
                    <thead><tr><th>Level</th><th>Count</th><th>%</th><th>Action</th></tr></thead>
                    <tbody>
                        <?php foreach ($dist as $d): ?>
                            <tr>
                                <td><?= $e($d['level']) ?></td>
                                <td><?= $e((string)$d['count']) ?></td>
                                <td><?= $e((string)$d['pct']) ?>%</td>
                                <td class="alo-muted"><?= $e($d['action']) ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </section>

        <section class="card">
            <header class="alo-card__head"><h2>Evaluation providers</h2></header>
            <div class="alo-table-wrap">
                <table class="alo-table alo-table--compact">
                    <thead><tr><th>Provider</th><th>Status</th><th>Note</th></tr></thead>
                    <tbody>
                        <?php foreach ($providers as $p): ?>
                            <tr>
                                <td class="alo-mono"><?= $e($p['name']) ?></td>
                                <td>
                                    <?php $cls = ['active'=>'success','ready'=>'info','standby'=>'warn','disabled'=>'danger'][$p['status']] ?? 'info'; ?>
                                    <span class="alo-badge alo-badge--<?= $cls ?>"><?= $e($p['status']) ?></span>
                                </td>
                                <td class="alo-muted"><?= $e($p['note']) ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </section>
    </div>

    <div class="alo-disclaimer-banner" role="note">
        <strong>Practice only.</strong> Automated evaluation is a practice indicator — not an official exam score.
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
