<?php
/**
 * views/student/practice-feedback.php — Automated practice feedback.
 * Expected vars: $feedback (array), $attempt_id, $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Practice feedback';
require __DIR__ . '/../layouts/header.php';
$feedback = isset($feedback) && is_array($feedback) ? $feedback : [
    'exam' => 'IELTS-A', 'evaluation_mode' => 'automated', 'evaluation_provider' => 'local_rule_engine',
    'confidence_level' => 'high', 'confidence_score' => '0.86',
    'writing' => ['task_achievement' => '6.5', 'coherence' => '7.0', 'vocabulary' => '6.5', 'grammar' => '7.0', 'word_count' => 268, 'improvement' => 'Use more varied linking devices.'],
    'speaking' => ['fluency' => '7.0', 'pronunciation' => '6.5', 'grammar' => '7.0', 'lexical' => '7.0', 'coherence' => '7.0'],
    'disclosure' => 'This feedback was generated automatically by the ALO Evaluation System using a local rule engine. It is a practice indicator, not an official exam score.',
];
$conf = (float)($feedback['confidence_score'] ?? '0.86');
$confCls = $conf >= 0.70 ? 'success' : ($conf >= 0.45 ? 'warn' : 'danger');
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Automated practice feedback</h1>
        <p><span class="alo-badge alo-badge--info"><?= $e($feedback['exam']) ?></span>
           <span class="alo-muted">Attempt <?= $e(isset($attempt_id) ? $attempt_id : '—') ?></span></p>
    </header>

    <div class="alo-badge alo-badge--info" role="note" style="display:block;padding:.75rem 1rem;margin-bottom:1rem;">
        <strong>Automated Practice Feedback.</strong>
        Provider: <?= $e($feedback['evaluation_provider']) ?> ·
        Confidence: <span class="alo-badge alo-badge--<?= $confCls ?>"><?= $e($feedback['confidence_level']) ?></span> (<?= $e((string)round($conf*100)) ?>%)
    </div>

    <div class="alo-grid alo-grid--2">
        <?php if (!empty($feedback['writing'])): $w = $feedback['writing']; ?>
        <section class="card">
            <header class="alo-card__head"><h2>Writing evaluation</h2></header>
            <div class="alo-table-wrap">
                <table class="alo-table alo-table--compact">
                    <tbody>
                        <tr><th>Task achievement</th><td><?= $e($w['task_achievement']) ?></td></tr>
                        <tr><th>Coherence</th><td><?= $e($w['coherence']) ?></td></tr>
                        <tr><th>Vocabulary</th><td><?= $e($w['vocabulary']) ?></td></tr>
                        <tr><th>Grammar</th><td><?= $e($w['grammar']) ?></td></tr>
                        <tr><th>Word count</th><td><?= $e((string)$w['word_count']) ?></td></tr>
                    </tbody>
                </table>
            </div>
            <p><strong>Improvement tip:</strong> <?= $e($w['improvement']) ?></p>
        </section>
        <?php endif; ?>

        <?php if (!empty($feedback['speaking'])): $s = $feedback['speaking']; ?>
        <section class="card">
            <header class="alo-card__head"><h2>Speaking evaluation</h2></header>
            <div class="alo-table-wrap">
                <table class="alo-table alo-table--compact">
                    <tbody>
                        <tr><th>Fluency</th><td><?= $e($s['fluency']) ?></td></tr>
                        <tr><th>Pronunciation (estimate)</th><td><?= $e($s['pronunciation']) ?></td></tr>
                        <tr><th>Grammar</th><td><?= $e($s['grammar']) ?></td></tr>
                        <tr><th>Lexical resource</th><td><?= $e($s['lexical']) ?></td></tr>
                        <tr><th>Coherence</th><td><?= $e($s['coherence']) ?></td></tr>
                    </tbody>
                </table>
            </div>
        </section>
        <?php endif; ?>
    </div>

    <section class="card">
        <header class="alo-card__head"><h2>Optional ALO Academic Team Review</h2></header>
        <p><?= $e($feedback['disclosure']) ?></p>
        <p>ALO Academic Team Review is <strong>optional</strong> and never blocks access to this feedback.</p>
        <form method="post" action="/student/practice-feedback/<?= $e(isset($attempt_id) ? $attempt_id : '') ?>">
            <input type="hidden" name="csrf_token" value="<?= $e(isset($csrf_token) ? $csrf_token : '') ?>">
            <input type="hidden" name="action" value="request_review">
            <button class="btn btn-secondary" type="submit">Request Optional Review</button>
        </form>
    </section>

    <div class="alo-disclaimer-banner" role="note">
        <strong>Practice only.</strong> Automated feedback is a practice indicator — not an official exam score.
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
