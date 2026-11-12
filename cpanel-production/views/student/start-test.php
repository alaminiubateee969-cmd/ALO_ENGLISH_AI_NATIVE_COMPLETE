<?php
/**
 * views/student/start-test.php — Pre-start confirmation page.
 * Expected vars: $set (array), $user, $quota_remaining. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Start practice test';
require __DIR__ . '/../layouts/header.php';
$set = isset($set) && is_array($set) ? $set : [
    'id' => 'IELTS-A-SET-007', 'exam' => 'IELTS-A', 'title' => 'IELTS Academic — Full Mock 7',
    'questions' => 60, 'duration_min' => 165, 'sections' => ['Listening (40)', 'Reading (40)', 'Writing (2)', 'Speaking (3)'],
];
$quota = isset($quota_remaining) ? $quota_remaining : 2;
?>
<section class="container alo-section alo-section--narrow">
    <header class="alo-section__head">
        <h1><?= $e($set['title']) ?></h1>
        <p><span class="alo-badge alo-badge--info"><?= $e($set['exam']) ?></span></p>
    </header>

    <div class="card">
        <h2>Before you begin</h2>
        <ul class="alo-list">
            <li><strong><?= $e((string)$set['questions']) ?> questions</strong> across <?= $e((string)count($set['sections'])) ?> sections.</li>
            <li>Time limit: <strong><?= $e((string)$set['duration_min']) ?> minutes</strong>. The timer cannot be paused.</li>
            <li>Free quota remaining after this attempt: <strong><?= $e((string)$quota) ?></strong>.</li>
            <li>Your webcam may be used for proctoring (with your consent). No data leaves the platform.</li>
            <li>You can navigate between questions using the palette. Answers are saved automatically.</li>
            <li>On submit, your Smart Score Report is generated automatically by the ALO Evaluation System.</li>
        </ul>
        <form method="post" action="/mock-test/start">
            <input type="hidden" name="csrf_token" value="<?= $e(isset($csrf_token) ? $csrf_token : '') ?>">
            <input type="hidden" name="set_id" value="<?= $e($set['id']) ?>">
            <label class="form-label"><input type="checkbox" name="consent_proctor" value="1" required> I consent to proctoring and the exam-disclaimer terms.</label>
            <div class="form-row"><button class="btn btn-primary" type="submit">Begin practice test &rarr;</button></div>
        </form>
    </div>

    <div class="alo-disclaimer-banner" role="note">
        <strong>Practice only.</strong> This is an original practice test — not an official exam.
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
