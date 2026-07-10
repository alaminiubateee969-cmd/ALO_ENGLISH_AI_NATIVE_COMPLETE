<?php
/**
 * views/public/how-exams-work.php — Exam conduct guide.
 *
 * Expected vars:
 *   - $e (callable)
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'How exams work';
require __DIR__ . '/../layouts/header.php';
?>
<section class="container alo-section alo-section--narrow">
    <header class="alo-section__head">
        <h1>How exams work on the ALO platform</h1>
        <p>A short guide to taking a mock test from start to finish — equipment, conduct, and disclaimers.</p>
    </header>

    <div class="alo-disclaimer-banner" role="note">
        <strong>Practice only.</strong>
        Mock tests on this Platform are original, exam-aligned practice
        material. Estimated scores are not official exam results.
    </div>

    <h2>Equipment requirements</h2>
    <ul>
        <li>A desktop or laptop computer (Windows, macOS, or Linux). Mobile phones are not supported for full mock tests.</li>
        <li>Latest stable version of Chrome, Edge, Firefox, or Safari.</li>
        <li>Stable internet connection (≥ 1 Mbps). Tests are not downloadable — they must be taken online.</li>
        <li>Webcam and microphone for speaking-section practice (optional but recommended).</li>
        <li>Headphones recommended to avoid echo during listening sections.</li>
        <li>A quiet, well-lit room with no background noise.</li>
    </ul>

    <h2>Before the exam</h2>
    <ol>
        <li>Sign in to your account and ensure you have at least one free or paid mock credit available.</li>
        <li>Close all other applications and browser tabs. Disable notifications and screen-recording software.</li>
        <li>Test your microphone and camera via your operating system settings.</li>
        <li>Have a photo ID ready if your exam requires identity verification (only for selected ALO internal exams).</li>
        <li>Read the practice disclaimer on the exam landing page carefully.</li>
    </ol>

    <h2>During the exam</h2>
    <ol>
        <li>Press "Start attempt". The timer begins immediately and cannot be paused.</li>
        <li>Answer each section in order. Some exams (e.g. SAT) use adaptive modules — you cannot return to a previous module once submitted.</li>
        <li>Your answers auto-save every 30 seconds. If your connection drops, your last saved answers are preserved for 60 minutes.</li>
        <li>Speaking sections record audio via your microphone. You will see a recording indicator.</li>
        <li>Writing sections accept typed text only. Copy-paste from external sources is disabled to prevent plagiarism.</li>
        <li>If you close the browser or lose power, your attempt enters "interrupted" status. You may resume from the last saved answer within 60 minutes.</li>
    </ol>

    <h2>After the exam</h2>
    <ol>
        <li>Press "Submit attempt" when you have finished all sections. You cannot change answers after submission.</li>
        <li>Objective sections (Reading, Listening, multiple-choice) are scored automatically within seconds.</li>
        <li>Speaking and Writing sections are queued for human examiner review. Results are typically available within 48 hours.</li>
        <li>Your Smart Score Report becomes available on your student dashboard once scoring is complete.</li>
        <li>You can download a PDF copy of the report from the results page.</li>
    </ol>

    <h2>Disclaimers</h2>
    <ul>
        <li>All items are original practice content and will not appear in any real exam.</li>
        <li>Scores are estimates produced by the ALO ScoringService and are not official exam results.</li>
        <li>Certificates issued by the Platform are practice-completion certificates only and are not recognised by any official testing body.</li>
        <li>The Platform is not affiliated with, endorsed by, or sponsored by any official test publisher.</li>
    </ul>

    <h2>Need help?</h2>
    <p>
        If your exam is interrupted by a technical issue you cannot resolve,
        contact us immediately via the <a href="/contact">Contact page</a>.
        Include your attempt ID (visible on your dashboard) so we can
        investigate.
    </p>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
